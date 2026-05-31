'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoadingScreen } from '@/components/LoadingScreen';

type ForgotStep = 'email' | 'code' | 'password';

export function ForgotPasswordContent() {
  const router = useRouter();
  const [step, setStep] = useState<ForgotStep>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSendCode = () => {
    const errors: Record<string, string> = {};
    if (!email.trim()) errors['email'] = 'Please enter your school email.';
    else if (!email.includes('@')) errors['email'] = 'Please enter a valid email.';
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setStep('code');
  };

  const handleSubmitCode = () => {
    if (!code.trim()) {
      setFieldErrors({ code: 'Please enter the verification code.' });
      return;
    }
    setFieldErrors({});
    setStep('password');
  };

  const handleSaveNewPassword = () => {
    const errors: Record<string, string> = {};
    if (!newPassword) errors['newPassword'] = 'Enter a new password.';
    if (!confirmNewPassword) errors['confirmNewPassword'] = 'Re-enter your new password.';
    if (newPassword && confirmNewPassword && newPassword !== confirmNewPassword) {
      errors['confirmNewPassword'] = "Passwords don't match.";
    }
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSavingPassword(true);
    window.setTimeout(() => {
      router.push('/login');
    }, 900);
  };

  return (
    <div className="login-scope forgot-scope">
      <main className={`forgot-shell forgot-shell--${step}`}>
        <section className="forgot-main" aria-label="Reset password form">
          <div className="forgot-form-panel">
            <div className="forgot-step" key={step}>
              <h1>Reset your password</h1>

              {step === 'email' && (
                <>
                  <p className="forgot-copy">Enter your school email and we will send a verification code.</p>

                  <div className="aria-live" aria-live="assertive" aria-atomic="true">
                    {Object.values(fieldErrors)[0]}
                  </div>

                  <label className="forgot-field">
                    <span>School Email:</span>
                    <input
                      type="email"
                      placeholder="Enter your school email"
                      value={email}
                      className={`field ${fieldErrors['email'] ? 'field--error' : ''}`}
                      aria-invalid={!!fieldErrors['email']}
                      aria-describedby={fieldErrors['email'] ? 'email-error' : undefined}
                      onChange={(e) => { setEmail(e.target.value); setFieldErrors((s) => { const c = { ...s }; delete c['email']; return c; }); }}
                    />
                    {fieldErrors['email'] && <div id="email-error" className="field-error-inline">{fieldErrors['email']}</div>}
                  </label>

                  <div className="forgot-controls">
                    <button className="forgot-back auth-mobile-control-back" type="button" onClick={() => router.back()}>
                      Go back to Sign In
                    </button>
                    <button className="forgot-primary" type="button" onClick={handleSendCode}>
                      Send verification code
                    </button>
                  </div>
                </>
              )}

              {step === 'code' && (
                <>
                  <p className="forgot-copy">Kindly check your email for the verification code.</p>

                  <label className="forgot-field">
                    <span>Verification Code:</span>
                    <input
                      type="text"
                      placeholder="Enter verification code"
                      value={code}
                      className={`field ${fieldErrors['code'] ? 'field--error' : ''}`}
                      aria-invalid={!!fieldErrors['code']}
                      aria-describedby={fieldErrors['code'] ? 'code-error' : undefined}
                      onChange={(e) => { setCode(e.target.value); setFieldErrors((s) => { const c = { ...s }; delete c['code']; return c; }); }}
                    />
                    {fieldErrors['code'] && <div id="code-error" className="field-error-inline">{fieldErrors['code']}</div>}
                  </label>

                  <div className="forgot-controls">
                    <button className="forgot-back" type="button" onClick={() => setStep('email')}>
                      Go back to School Email
                    </button>
                    <button className="forgot-primary" type="button" onClick={handleSubmitCode}>
                      Submit
                    </button>
                  </div>
                </>
              )}

              {step === 'password' && (
                <>
                  <p className="forgot-copy">Change your password.</p>

                  <label className="forgot-field forgot-password-field">
                    <span>New Password:</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your new password"
                      value={newPassword}
                      className={`field ${fieldErrors['newPassword'] ? 'field--error' : ''}`}
                      aria-invalid={!!fieldErrors['newPassword']}
                      aria-describedby={fieldErrors['newPassword'] ? 'newPassword-error' : undefined}
                      onChange={(e) => { setNewPassword(e.target.value); setFieldErrors((s) => { const c = { ...s }; delete c['newPassword']; return c; }); }}
                    />
                    <button
                      className="forgot-eye"
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      <Image
                        src={showPassword ? '/svg icons sign in page/Eye (1).svg' : '/svg icons sign in page/Eye off.svg'}
                        alt=""
                        width={48}
                        height={48}
                      />
                    </button>
                    {fieldErrors['newPassword'] && <div id="newPassword-error" className="field-error-inline">{fieldErrors['newPassword']}</div>}
                  </label>

                  <label className="forgot-field forgot-password-field">
                    <span>Re-enter Password:</span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={confirmNewPassword}
                      className={`field ${fieldErrors['confirmNewPassword'] ? 'field--error' : ''}`}
                      aria-invalid={!!fieldErrors['confirmNewPassword']}
                      aria-describedby={fieldErrors['confirmNewPassword'] ? 'confirmNewPassword-error' : undefined}
                      onChange={(e) => { setConfirmNewPassword(e.target.value); setFieldErrors((s) => { const c = { ...s }; delete c['confirmNewPassword']; return c; }); }}
                    />
                    <button
                      className="forgot-eye"
                      type="button"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowConfirmPassword((current) => !current)}
                    >
                      <Image
                        src={showConfirmPassword ? '/svg icons sign in page/Eye (1).svg' : '/svg icons sign in page/Eye off.svg'}
                        alt=""
                        width={48}
                        height={48}
                      />
                    </button>
                    {fieldErrors['confirmNewPassword'] && <div id="confirmNewPassword-error" className="field-error-inline">{fieldErrors['confirmNewPassword']}</div>}
                  </label>

                  <div className="forgot-controls">
                    <button className="forgot-back" type="button" onClick={() => setStep('code')}>
                      Go back to Verification Code
                    </button>
                    <button className="forgot-primary" type="button" onClick={handleSaveNewPassword}>
                      Save New Password
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <aside className="forgot-side" aria-label="Forgot password brand panel">
          <div className="forgot-side__content">
            <img
              className="forgot-side__logo"
              src="/dcspace-logos/dcspace-whitetext-transparent.svg"
              alt="DC Space logo"
              width={498}
              height={270}
              decoding="async"
              fetchPriority="high"
            />
            <h2>Forgot your password?</h2>
            {step === 'email' && (
              <>
                <p>I remember my password!</p>
                <button className="forgot-signin-btn" type="button" onClick={() => router.back()}>
                  <span>SIGN IN</span>
                  <Image src="/svg icons forgot password page/Arrow right.svg" alt="" width={24} height={24} />
                </button>
              </>
            )}
          </div>
        </aside>
      </main>
      {isSavingPassword && <LoadingScreen context="reset-password-save" />}
    </div>
  );
}
