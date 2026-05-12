import type { Metadata } from "next";
import { ForgotPasswordPanel } from "@/components/ForgotPasswordPanel";
import "@/app/login/login.css";

export const metadata: Metadata = {
  title: "Forgot Password | DC Space",
};

export default function ForgotPasswordPage() {
  return (
    <div className="login-scope">
      <main className="forgot-page">
        <ForgotPasswordPanel />
      </main>
    </div>
  );
}
