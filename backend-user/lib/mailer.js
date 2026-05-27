import nodemailer from "nodemailer";

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
}

function getFromAddress() {
  return process.env.SMTP_FROM?.trim() || "DC Space <noreply@sdca.edu.ph>";
}

function buildVerificationContent(code) {
  const subject = "Your DC Space verification code";
  const text = [
    "Hello,",
    "",
    `Your DC Space verification code is: ${code}`,
    "",
    "Enter this code on the registration screen to verify your school email.",
    "The code expires in 15 minutes.",
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");

  return { subject, text };
}

function createTransport() {
  const host = process.env.SMTP_HOST.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = port === 465 || process.env.SMTP_SECURE === "true";

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER.trim(),
      pass: process.env.SMTP_PASS.trim(),
    },
    tls: {
      minVersion: "TLSv1.2",
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
    },
  });
}

function smtpNotConfiguredError() {
  return new Error(
    "Email is not set up. Set SMTP_USER to your @sdca.edu.ph Gmail address and SMTP_PASS to a Gmail App Password in .env.local and backend-user/.env, then restart the servers.",
  );
}

function shouldLogVerificationCodeInsteadOfEmail() {
  return process.env.VERIFICATION_LOG_CODE === "true";
}

/**
 * Sends a registration verification email. Requires SMTP to be configured in production.
 * In development, logs the code to the server console when SMTP is not set (see VERIFICATION_LOG_CODE).
 */
export async function sendVerificationEmail({ email, code }) {
  if (!isSmtpConfigured()) {
    if (shouldLogVerificationCodeInsteadOfEmail()) {
      console.info(`[DC Space] Verification code for ${email}: ${code}`);
      return { delivered: true, devMode: true };
    }
    throw smtpNotConfiguredError();
  }

  const from = getFromAddress();
  const { subject, text } = buildVerificationContent(code);
  const transport = createTransport();

  try {
    await transport.verify();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown SMTP error";
    throw new Error(`Could not connect to the mail server (${process.env.SMTP_HOST}). ${message}`);
  }

  try {
    await transport.sendMail({
      from,
      to: email,
      subject,
      text,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown send error";
    throw new Error(`Could not send verification email. ${message}`);
  }

  return { delivered: true };
}
