<<<<<<< HEAD
import type { Metadata } from 'next';
import { LoginForm } from '@/components/LoginForm';
=======
import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";
>>>>>>> backup/backend-user

export const metadata: Metadata = {
  title: 'Login | DC Space',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<main style={{ padding: "2rem" }}>Loading…</main>}>
      <LoginForm />
    </Suspense>
  );
}
