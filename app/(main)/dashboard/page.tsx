import type { Metadata } from 'next';
import { DashboardPageContent } from '@/components/DashboardPageContent';
import '@/styles/pages/dashboard.css';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return <DashboardPageContent />;
}
