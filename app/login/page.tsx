import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Login | DC Space",
};

export default function LoginPage() {
  return <LoginForm />;
}
