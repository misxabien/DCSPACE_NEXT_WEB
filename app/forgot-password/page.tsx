import type { Metadata } from 'next';
import { ForgotPasswordContent } from '@/components/ForgotPasswordContent';
import '@/app/login/login.css';

export const metadata: Metadata = {
  title: 'Forgot Password | DC Space',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordContent />;
}
