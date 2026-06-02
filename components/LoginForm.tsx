'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { signInAttendanceUser } from '@/lib/attendance';

export function LoginForm() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<'student' | 'faculty'>('student');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (fieldName: string) => {
    setFieldErrors((current) => {
      const updated = { ...current };
      delete updated[fieldName];
      return updated;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    const errors: Record<string, string> = {};
    const emailValue = typeof email === 'string' ? email.trim() : '';
    const passwordValue = typeof password === 'string' ? password.trim() : '';

    if (!emailValue) {
      errors.email = 'Email is required.';
    } else if (!emailValue.toLowerCase().endsWith('@sdca.edu.ph')) {
      errors.email = "Invalid school email. Email must end with '@sdca.edu.ph'.";
    }

    if (!passwordValue) {
      errors.password = 'Password is required.';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    window.localStorage.setItem('dcspaceAccountType', role);
    signInAttendanceUser(emailValue);
    router.push('/home');
  };

  return (
    <main className="page">
      <section className="layout" aria-label="Login layout">
        <aside className="brand" aria-label="Brand section">
          <div className="brand__logo-wrap">
            <Image
              className="brand__logo"
              src="/dcspace-logos/dcspace-whitetext-transparent.svg"
              alt="DC Space logo"
              width={498}
              height={270}
              priority
            />
          </div>
          <div className="brand__headline">TAP. ATTEND. GET CERTIFIED.</div>
          <div className="brand__sub">
            An AI-assisted RFID system designed to simplify event tracking and automate certificate
            issuance.
          </div>
        </aside>

        <section className="card" aria-label="Login card">
          <h1>SIGN IN TO DC SPACE!</h1>

          <form
            onSubmit={handleSubmit}
            autoComplete="on"
          >
            <label className="field">
              <span className="field__label">Your School Email:</span>
              <span className="icon-left" aria-hidden>
                <Image src="/svg icons sign in page/mail.svg" alt="" width={35} height={35} />
              </span>
              <input
                className={`input${fieldErrors.email ? ' is-error' : ''}`}
                name="email"
                type="email"
                placeholder="Enter your school email address"
                aria-invalid={!!fieldErrors.email}
                onChange={() => clearFieldError('email')}
              />
            </label>

            {fieldErrors.email && (
              <p className="auth-field-error">{fieldErrors.email}</p>
            )}

            <label className="field field--password">
              <span className="field__label">Password:</span>
              <span className="icon-left" aria-hidden>
                <Image src="/svg icons sign in page/Lock.svg" alt="" width={35} height={35} />
              </span>

              <input
                id="password"
                className={`input${fieldErrors.password ? ' is-error' : ''}`}
                name="password"
                type={showPw ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-invalid={!!fieldErrors.password}
                onChange={() => clearFieldError('password')}
              />

              <button
                className="btn eye"
                type="button"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                onClick={() => setShowPw((s) => !s)}
              >
                <Image
                  src={showPw ? '/svg icons sign in page/Eye (1).svg' : '/svg icons sign in page/Eye off.svg'}
                  alt=""
                  width={48}
                  height={48}
                />
              </button>
            </label>

            {fieldErrors.password && (
              <p className="auth-field-error">{fieldErrors.password}</p>
            )}

            <div className="actions">
              <Link className="link" href="/forgot-password" aria-label="Forgot password">
                Forgot your password?
              </Link>
            </div>

            <button className="btn primary" type="submit">
              SIGN IN
            </button>
          </form>

          <div className="below">
            {"Don't have an account?"}
            <Link href="/register" aria-label="Register here">
              REGISTER HERE
            </Link>
          </div>

          <div className={`role role--${role}`} role="group" aria-label="Role selection">
            <button
              className="btn role__btn"
              type="button"
              aria-pressed={role === 'student'}
              onClick={() => setRole('student')}
            >
              <Image src="/svg icons sign in page/ph_student (1).svg" alt="" width={26} height={26} />
              Student
            </button>
            <button
              className="btn role__btn"
              type="button"
              aria-pressed={role === 'faculty'}
              onClick={() => setRole('faculty')}
            >
              <Image src="/svg icons sign in page/faculty-icon.svg" alt="" width={31} height={17} />
              Faculty
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}