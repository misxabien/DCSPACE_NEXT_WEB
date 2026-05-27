'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useState } from 'react';
<<<<<<< HEAD
import { loginUser, saveAuthSession } from '@/lib/user-api';
import { syncProfileToLegacyStorage } from '@/lib/user-mappers';
=======
import { signInAttendanceUser } from '@/lib/attendance';
>>>>>>> origin/frontend-user

export function LoginForm() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<'student' | 'faculty'>('student');

<<<<<<< HEAD
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    const formData = new FormData(submitEvent.currentTarget);
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '');

    if (!email || !password) {
      setErrorMessage('Email and password are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const result = await loginUser(email, password);
      saveAuthSession(result.token, result.user);
      syncProfileToLegacyStorage(result.user);
      window.localStorage.setItem('dcspaceAccountType', role);
      router.push('/home');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
=======
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email');

    window.localStorage.setItem('dcspaceAccountType', role);
    signInAttendanceUser(typeof email === 'string' ? email : '');
    router.push('/home');
>>>>>>> origin/frontend-user
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
                className="input"
                name="email"
                type="email"
                placeholder="Enter your school email address"
                required
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

            <div className="actions">
              <Link className="link" href="/forgot-password" aria-label="Forgot password">
                Forgot your password?
              </Link>
            </div>

            {errorMessage ? (
              <p className="form-error" role="alert">
                {errorMessage}
              </p>
            ) : null}

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

