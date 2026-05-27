'use client';

import { Sidebar } from '@/components/Sidebar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: Readonly<AppShellProps>) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app">
      <Sidebar />
      <main className="main">{children}</main>
    </div>
  );
}
