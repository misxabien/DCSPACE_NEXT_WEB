import type { Metadata } from 'next';
import { SubmitFeedbackContent } from '@/components/SubmitFeedbackContent';
import '@/styles/pages/submit-feedback.css';

export const metadata: Metadata = {
  title: 'Submit Feedback - DC Space',
};

export default function SubmitFeedbackPage() {
  return <SubmitFeedbackContent />;
}
