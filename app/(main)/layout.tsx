import { AppShell } from '@/components/AppShell';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
