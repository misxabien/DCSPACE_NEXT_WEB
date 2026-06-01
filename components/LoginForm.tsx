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
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');

    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'School email is required';
    } else if (!email.endsWith('@sdca.edu.ph')) {
      newErrors.email = "Invalid school email. Email must end with '@sdca.edu.ph'";
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    window.localStorage.setItem('dcspaceAccountType', role);
    signInAttendanceUser(email);
    router.push('/home');
  };

  const clearError = (field: 'email' | 'password') => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
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
            <label className={`field${errors.email ? ' field--error' : ''}`}>
              <span className="field__label">Your School Email:</span>
              <span className="icon-left" aria-hidden>
                <Image src="/svg icons sign in page/mail.svg" alt="" width={35} height={35} />
              </span>
              <input
                className="input"
                name="email"
                type="email"
                placeholder="Enter your school email address"
                required
                onChange={() => clearError('email')}
              />
              {errors.email && <span className="field-error-msg">{errors.email}</span>}
            </label>

            <label className={`field field--password${errors.password ? ' field--error' : ''}`}>
              <span className="field__label">Password:</span>
              <span className="icon-left" aria-hidden>
                <Image src="/svg icons sign in page/Lock.svg" alt="" width={35} height={35} />
              </span>

              <input
                id="password"
                className="input"
                name="password"
                type={showPw ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                onChange={() => clearError('password')}
              />
              {errors.password && <span className="field-error-msg">{errors.password}</span>}

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
            Don&apos;t have an account?
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

