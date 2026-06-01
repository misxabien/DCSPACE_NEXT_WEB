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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const passwordChecks = [
    newPassword.length >= 8,
    /[A-Z]/.test(newPassword),
    /[a-z]/.test(newPassword),
    /\d/.test(newPassword),
    /[^A-Za-z0-9]/.test(newPassword),
  ];
  const passedPasswordChecks = passwordChecks.filter(Boolean).length;
  const passwordStrength = passedPasswordChecks >= 5 ? 'Strong' : passedPasswordChecks >= 3 ? 'Medium' : 'Weak';
  const filledStrengthBoxes = passwordStrength === 'Strong' ? 5 : passwordStrength === 'Medium' ? 3 : 1;
  const showPasswordWarning = newPassword.length > 0 && passwordStrength === 'Weak';
  const showPasswordMatch = confirmNewPassword.length > 0;
  const passwordMatches = newPassword.length > 0 && newPassword === confirmNewPassword;

  const handleSendCode = () => {
    const emailInput = document.querySelector<HTMLInputElement>('.forgot-field input[type="email"]');
    const email = emailInput?.value?.trim() || '';
    if (!email) {
      setFieldErrors({ email: 'School email is required' });
      return;
    }
    if (!email.endsWith('@sdca.edu.ph')) {
      setFieldErrors({ email: "Invalid school email. Email must end with '@sdca.edu.ph'" });
      return;
    }
    setFieldErrors({});
    setStep('code');
  };

  const handleSubmitCode = () => {
    const codeInput = document.querySelector<HTMLInputElement>('.forgot-field input[type="text"]');
    const code = codeInput?.value?.trim() || '';
    if (!code) {
      setFieldErrors({ code: 'Please enter a valid verification code.' });
      return;
    }
    setFieldErrors({});
    setStep('password');
  };

  const handleSaveNewPassword = () => {
    const errors: Record<string, string> = {};
    if (!newPassword) {
      errors.newPassword = 'Password is required';
    } else {
      const checks = [
        newPassword.length >= 8,
        /[A-Z]/.test(newPassword),
        /[a-z]/.test(newPassword),
        /\d/.test(newPassword),
        /[^A-Za-z0-9]/.test(newPassword),
      ];
      if (checks.filter(Boolean).length < 5) {
        errors.newPassword = 'Password is too weak';
      }
    }
    if (!confirmNewPassword) {
      errors.confirmNewPassword = 'Re-enter your password';
    } else if (newPassword !== confirmNewPassword) {
      errors.confirmNewPassword = "Passwords don't match";
    }

    if (Object.keys(errors).length > 0) {
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

                  <label className={`forgot-field${fieldErrors.email ? ' has-error' : ''}`}>
                    <span>School Email:</span>
                    <input type="email" placeholder="Enter your school email" onChange={() => setFieldErrors((prev) => { const next = { ...prev }; delete next.email; return next; })} />
                    {fieldErrors.email && <span className="field-error-msg">{fieldErrors.email}</span>}
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

                  <label className={`forgot-field${fieldErrors.code ? ' has-error' : ''}`}>
                    <span>Verification Code:</span>
                    <input type="text" placeholder="Enter verification code" onChange={() => setFieldErrors((prev) => { const next = { ...prev }; delete next.code; return next; })} />
                    {fieldErrors.code && <span className="field-error-msg">{fieldErrors.code}</span>}
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

                  <label className={`forgot-field forgot-password-field${fieldErrors.newPassword ? ' has-error' : ''}`}>
                    <span>New Password:</span>
                    <div className="forgot-input-wrap">
                      <input type={showPassword ? 'text' : 'password'} placeholder="Enter your new password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setFieldErrors((prev) => { const next = { ...prev }; delete next.newPassword; return next; }); }} />
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
                    </div>
                    {fieldErrors.newPassword && <span className="field-error-msg">{fieldErrors.newPassword}</span>}
                  </label>

                  {newPassword.length > 0 && (
                    <div className={`password-strength password-strength--${passwordStrength.toLowerCase()}`}>
                      <div className="password-strength__bars" aria-hidden>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <span className={index < filledStrengthBoxes ? 'is-filled' : ''} key={index} />
                        ))}
                      </div>
                      <p>Password Strength: {passwordStrength}</p>
                      {showPasswordWarning && (
                        <p className="password-strength__warning">
                          Password must be at least 8 characters and include uppercase, lowercase, number, and special character.
                        </p>
                      )}
                    </div>
                  )}

                  <label className={`forgot-field forgot-password-field${fieldErrors.confirmNewPassword ? ' has-error' : ''}`}>
                    <span>Re-enter Password:</span>
                    <div className="forgot-input-wrap">
                      <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter your password" value={confirmNewPassword} onChange={(e) => { setConfirmNewPassword(e.target.value); setFieldErrors((prev) => { const next = { ...prev }; delete next.confirmNewPassword; return next; }); }} />
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
                    </div>
                    {fieldErrors.confirmNewPassword && <span className="field-error-msg">{fieldErrors.confirmNewPassword}</span>}
                  </label>

                  {showPasswordMatch && (
                    <p className={`password-match ${passwordMatches ? 'is-match' : 'is-mismatch'}`}>
                      {passwordMatches ? 'Password matched!' : "Password doesn't match."}
                    </p>
                  )}

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
            <Image
              className="forgot-side__logo"
              src="/dcspace-logos/dcspace-whitetext-transparent.svg"
              alt="DC Space logo"
              width={498}
              height={270}
              priority
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
