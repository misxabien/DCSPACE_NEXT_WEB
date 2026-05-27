'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ForgotStep = 'email' | 'code' | 'password';

export function ForgotPasswordContent() {
  const router = useRouter();
  const [step, setStep] = useState<ForgotStep>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

                  <label className="forgot-field">
                    <span>School Email:</span>
                    <input type="email" placeholder="Enter your school email" />
                  </label>

                  <div className="forgot-controls">
                    <button className="forgot-back auth-mobile-control-back" type="button" onClick={() => router.back()}>
                      Go back to Sign In
                    </button>
                    <button className="forgot-primary" type="button" onClick={() => setStep('code')}>
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
                    <input type="text" placeholder="Enter your school email" />
                  </label>

                  <div className="forgot-controls">
                    <button className="forgot-back" type="button" onClick={() => setStep('email')}>
                      Go back to School Email
                    </button>
                    <button className="forgot-primary" type="button" onClick={() => setStep('password')}>
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
                    <input type={showPassword ? 'text' : 'password'} placeholder="Enter your new password" />
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
                  </label>

                  <label className="forgot-field forgot-password-field">
                    <span>Re-enter Password:</span>
                    <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter your password" />
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
                  </label>

                  <div className="forgot-controls">
                    <button className="forgot-back" type="button" onClick={() => setStep('code')}>
                      Go back to Verification Code
                    </button>
                    <button className="forgot-primary" type="button">
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
    </div>
  );
}
