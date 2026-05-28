import nodemailer from 'nodemailer';

const SMTP_SEND_TIMEOUT_MS = 25_000;

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
}

function getFromAddress() {
  return process.env.SMTP_FROM?.trim() || 'DC Space <noreply@sdca.edu.ph>';
}

function shouldLogVerificationCodeInsteadOfEmail() {
  return process.env.VERIFICATION_LOG_CODE === 'true';
}

function smtpNotConfiguredError() {
  return new Error(
    'Email is not set up. Add SMTP_HOST, SMTP_USER, and SMTP_PASS to .env.local (use a Gmail App Password for SMTP_PASS), then restart npm run dev.',
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function sendVerificationEmail({ email, code }: { email: string; code: string }) {
  if (!isSmtpConfigured()) {
    if (shouldLogVerificationCodeInsteadOfEmail()) {
      console.info(`[DC Space] Verification code for ${email}: ${code}`);
      return { delivered: true, devMode: true };
    }
    throw smtpNotConfiguredError();
  }

  const host = process.env.SMTP_HOST!.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = port === 465 || process.env.SMTP_SECURE === 'true';
  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER!.trim(),
      pass: process.env.SMTP_PASS!.trim(),
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    tls: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
    },
  });

  const subject = 'Your DC Space verification code';
  const text = [
    'Hello,',
    '',
    `Your DC Space verification code is: ${code}`,
    '',
    'Enter this code on the registration screen to verify your school email.',
    'The code expires in 15 minutes.',
    '',
    'If you did not request this, you can ignore this email.',
  ].join('\n');

  try {
    await withTimeout(
      transport.sendMail({
        from: getFromAddress(),
        to: email,
        subject,
        text,
      }),
      SMTP_SEND_TIMEOUT_MS,
      'Email server timed out. Check SMTP settings in .env.local or try a different network (port 587 must be allowed).',
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown email error';
    if (/timed out|timeout|ETIMEDOUT|ESOCKET/i.test(message)) {
      throw new Error(
        'Could not reach the email server in time. Verify SMTP_HOST, SMTP_USER, and SMTP_PASS in .env.local, or set VERIFICATION_LOG_CODE=true for local testing.',
      );
    }
    throw error;
  } finally {
    transport.close();
  }

  return { delivered: true, devMode: false };
}
