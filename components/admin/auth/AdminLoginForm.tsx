"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { getSession, signIn, signOut } from "next-auth/react";

function EyeOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14.12 14.12C13.8454 14.4147 13.5141 14.6511 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.481 9.80385 14.1961C9.51897 13.9113 9.29439 13.5719 9.14351 13.1984C8.99262 12.8248 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4858 9.58525 10.1546 9.88 9.87999M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68189 3.96914 7.6566 6.06 6.05999L17.94 17.94ZM9.9 4.23999C10.5883 4.07887 11.2931 3.99833 12 3.99999C19 3.99999 23 12 23 12C22.393 13.1356 21.6691 14.2047 20.84 15.19L9.9 4.23999Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1 1L23 23"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl")?.trim() || "/admin";

  const handleGoogle = () => {
    setError("");
    void signIn("google", { callbackUrl });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    if (typeof email !== "string" || typeof password !== "string") {
      setError("Email and password are required.");
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      const session = await getSession();
      if (session?.user?.role !== "admin") {
        await signOut({ redirect: false });
        setError("This account does not have admin access.");
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Unable to sign in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="page admin-login-page">
      <section className="layout" aria-label="Admin login layout">
        <aside className="brand" aria-label="Brand section">
          <div className="brand__logo-wrap brand__logo-wrap--admin">
            <Image
              className="brand__logo"
              src="/assets/white-dcspacelogo-transparent.svg"
              alt="DC Space logo"
              width={568}
              height={568}
              priority
            />
          </div>
          <div className="brand__headline">TAP. ATTEND. GET CERTIFIED.</div>
          <div className="brand__sub">
            An AI-assisted RFID system designed to simplify event tracking and automate certificate
            issuance.
          </div>
        </aside>

        <section className="card" aria-label="Admin login card">
          <p className="admin-login-eyebrow">Admin sign in</p>

          <button
            className="btn google"
            type="button"
            aria-label="Continue with SDCA Gmail Account"
            onClick={handleGoogle}
            disabled={loading}
          >
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

          <form onSubmit={handleSubmit} autoComplete="on">
            <label className="field">
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
              <input
                className="input"
                name="email"
                type="email"
                placeholder="Email"
                autoComplete="username"
                required
                disabled={loading}
              />
            </label>

            <label className="field field--password">
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
                className="input"
                name="password"
                type={showPw ? "text" : "password"}
                placeholder="Password"
                autoComplete="current-password"
                required
                disabled={loading}
              />

              <button
                className="btn eye"
                type="button"
                aria-label={showPw ? "Hide password" : "Show password"}
                onClick={() => setShowPw((s) => !s)}
                disabled={loading}
              >
                {showPw ? <EyeOpenIcon /> : <EyeClosedIcon />}
              </button>
            </label>

            {error ? (
              <p className="auth-field-error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="actions">
              <Link className="link" href="/forgot-password" aria-label="Forgot password">
                FORGOT PASSWORD?
              </Link>
            </div>

            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? "SIGNING IN…" : "SIGN IN"}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
