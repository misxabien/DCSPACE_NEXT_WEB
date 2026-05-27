import type { Metadata } from 'next';
import { DashboardPageContent } from '@/components/DashboardPageContent';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return <DashboardPageContent />;
}
