import type { Metadata } from "next";
import { RegisterAccountContent } from "@/components/RegisterAccountContent";
import "@/app/login/login.css";

export const metadata: Metadata = {
  title: "Register | DC Space",
};

export default function RegisterPage() {
  return <RegisterAccountContent />;
}
