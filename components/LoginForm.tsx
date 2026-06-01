'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { signInAttendanceUser } from '@/lib/attendance';

function isValidSchoolEmail(email: string) {
  const trimmed = email.trim();
  return trimmed.length > 0 && trimmed.endsWith('@sdca.edu.ph');
}

export function LoginForm() {
  const router = useRouter();

  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<'student' | 'faculty'>('student');

  const [emailError, setEmailError] = useState<string>('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const emailRaw = formData.get('email');
    const email = typeof emailRaw === 'string' ? emailRaw : '';

    const nextError = "Invalid school email. Email must end with '@sdca.edu.ph'";

    if (!isValidSchoolEmail(email)) {
      setEmailError(nextError);
      return;
    }

    setEmailError('');
    window.localStorage.setItem('dcspaceAccountType', role);
    signInAttendanceUser(email);
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
            <label className="field field--with-inline-error">
              <span className="field__label">Your School Email:</span>

              <span className="icon-left" aria-hidden>
                <Image src="/svg icons sign in page/mail.svg" alt="" width={35} height={35} />
              </span>

              <input
                className={`input ${emailError ? 'is-error' : ''}`}
                name="email"
                type="email"
                placeholder="Enter your school email address"
                required
              />

              {emailError && <p className="auth-field-error">{emailError}</p>}
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

