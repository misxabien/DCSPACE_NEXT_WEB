import { AppShell } from "@/components/AppShell";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: Readonly<MainLayoutProps>) {
  return <AppShell>{children}</AppShell>;
}
