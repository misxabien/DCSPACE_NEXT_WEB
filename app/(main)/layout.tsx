import { AppShell } from '@/components/AppShell';
import '@/styles/pages/dashboard.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: Readonly<MainLayoutProps>) {
  return <AppShell>{children}</AppShell>;
}
