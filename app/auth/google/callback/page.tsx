"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { signInAttendanceUser } from "@/lib/attendance";
import { createGoogleUserSession, saveAuthSession, saveUserProfileDetails } from "@/lib/user-api";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function completeGoogleLogin() {
      try {
        const result = await createGoogleUserSession();

        if (!isActive) {
          return;
        }

        saveAuthSession(result.token, result.user);
        saveUserProfileDetails(result.user);
        signInAttendanceUser(result.user.email);
        router.replace("/dashboard");
      } catch (callbackError) {
        if (!isActive) {
          return;
        }

        await signOut({ redirect: false });
        setError(callbackError instanceof Error ? callbackError.message : "Failed to complete Google login.");
      }
    }

    completeGoogleLogin();

    return () => {
      isActive = false;
    };
  }, [router]);

  return (
    <main className="page">
      <section className="card" aria-label="Google login status">
        <h1>{error ? "Google login failed" : "Signing you in..."}</h1>
        {error ? (
          <>
            <p className="auth-field-error">{error}</p>
            <Link className="btn primary" href="/login">
              Back to login
            </Link>
          </>
        ) : (
          <p>Please wait while we finish your Google login.</p>
        )}
      </section>
    </main>
  );
}
