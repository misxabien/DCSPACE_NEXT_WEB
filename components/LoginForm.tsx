'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { loginUser, saveAuthSession } from '@/lib/user-api';
import { syncProfileToLegacyStorage } from '@/lib/user-mappers';

export function LoginForm() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<'student' | 'faculty'>('student');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '');

    if (!email || !password) {
      setErrorMessage('Please enter your school email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      window.localStorage.setItem('dcspaceAccountType', role);
      const result = await loginUser(email, password);
      saveAuthSession(result.token, result.user);
      syncProfileToLegacyStorage(result.user);
      router.push('/home');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Sign in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page">
      <section className="layout" aria-label="Login layout">
        <aside className="brand" aria-label="Brand section">
          <div className="brand__logo-wrap">
            {/* Native img: Next/Image breaks this SVG (embedded raster pattern renders as a black box). */}
            <img
              className="brand__logo"
              src="/dcspace-logos/dcspace-whitetext-transparent.svg"
              alt="DC Space logo"
              width={498}
              height={270}
              decoding="async"
              fetchPriority="high"
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

          <form onSubmit={handleSubmit} autoComplete="on">
            <label className="field">
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
                disabled={isSubmitting}
              />
            </label>

            <label className="field field--password">
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
                disabled={isSubmitting}
              />

              <button
                className="btn eye"
                type="button"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                onClick={() => setShowPw((s) => !s)}
                disabled={isSubmitting}
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

            {errorMessage && (
              <p className="auth-field-error" role="alert">
                {errorMessage}
              </p>
            )}

            <button className="btn primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'SIGNING IN…' : 'SIGN IN'}
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
              disabled={isSubmitting}
            >
              <Image src="/svg icons sign in page/ph_student (1).svg" alt="" width={26} height={26} />
              Student
            </button>
            <button
              className="btn role__btn"
              type="button"
              aria-pressed={role === 'faculty'}
              onClick={() => setRole('faculty')}
              disabled={isSubmitting}
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
