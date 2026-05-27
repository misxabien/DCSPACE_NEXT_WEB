import { AppShell } from '@/components/AppShell';
import '@/styles/pages/dashboard.css';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
