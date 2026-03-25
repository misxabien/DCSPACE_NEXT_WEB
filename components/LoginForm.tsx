"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<"student" | "faculty">("student");

  return (
    <main className="page">
      <section className="layout" aria-label="Login layout">
        <aside className="brand" aria-label="Brand section">
          <div className="brand__logo-wrap">
            <Image
              className="brand__logo"
              src="/assets/logo-dc-space.png"
              alt="DC Space logo"
              width={430}
              height={200}
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
          <button className="btn google" type="button" aria-label="Continue with Google">
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303C33.653 32.657 29.236 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.967 3.033l5.657-5.657C34.72 6.053 29.617 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"
              />
              <path
                fill="#FF3D00"
                d="M6.306 14.691l6.571 4.819C14.655 16.108 19.001 12 24 12c3.059 0 5.842 1.154 7.967 3.033l5.657-5.657C34.72 6.053 29.617 4 24 4 16.318 4 9.656 8.336 6.306 14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.112 0 9.828-1.967 13.377-5.158l-6.174-5.227C29.297 35.091 26.756 36 24 36c-5.215 0-9.619-3.317-11.297-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.1 5.615h.001l6.174 5.227C36.941 39.243 44 34 44 24c0-1.341-.138-2.651-.389-3.917z"
              />
            </svg>
            <span>Continue with SDCA Gmail Account</span>
          </button>

          <div className="divider" aria-hidden>
            OR
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push("/dashboard");
            }}
            autoComplete="on"
          >
            <label className="field field--password">
              <span className="sr-only">Email</span>
              <span className="icon-left" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 6.5c0-1.105.895-2 2-2h12c1.105 0 2 .895 2 2v11c0 1.105-.895 2-2 2H6c-1.105 0-2-.895-2-2v-11Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.2 7.1 12 11.2l5.8-4.1"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <input className="input" name="email" type="email" placeholder="Email" required />
            </label>

            <label className="field">
              <span className="sr-only">Password</span>
              <span className="icon-left" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7 10V8.2C7 5.88 8.79 4 11 4h2c2.21 0 4 1.88 4 4.2V10"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6.5 10h11A2.5 2.5 0 0 1 20 12.5v5A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-5A2.5 2.5 0 0 1 6.5 10Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <input
                id="password"
                className="input"
                name="password"
                type={showPw ? "text" : "password"}
                placeholder="Password"
                autoComplete="current-password"
                required
              />

              <button
                className="btn eye"
                type="button"
                aria-label={showPw ? "Hide password" : "Show password"}
                onClick={() => setShowPw((s) => !s)}
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M2.3 12s3.4-7 9.7-7 9.7 7 9.7 7-3.4 7-9.7 7-9.7-7-9.7-7Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 15.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                </svg>
              </button>
            </label>

            <div className="actions">
              <Link className="link" href="#" aria-label="Forgot password">
                FORGOT PASSWORD?
              </Link>
            </div>

            <button className="btn primary" type="submit">
              SIGN IN
            </button>
          </form>

          <div className="below">
            Don&apos;t have an account?
            <Link href="#" aria-label="Register here">
              REGISTER HERE
            </Link>
          </div>

          <div className="role" role="group" aria-label="Role selection">
            <button
              className="btn role__btn"
              type="button"
              aria-pressed={role === "student"}
              onClick={() => setRole("student")}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 3 2.5 8l9.5 5 9.5-5L12 3Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.5 10.5V16c0 1.4 3 3.5 6.5 3.5s6.5-2.1 6.5-3.5v-5.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              Student
            </button>
            <button
              className="btn role__btn"
              type="button"
              aria-pressed={role === "faculty"}
              onClick={() => setRole("faculty")}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.8" />
                <path
                  d="M16.6 10.2a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M4 20v-1.2c0-2.1 3-4 5-4s5 1.9 5 4V20"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M14.4 20v-1c0-1.7 2.1-3.2 3.6-3.2S22 17.3 22 19v1"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              Faculty
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
