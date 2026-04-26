import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AppShell } from "@/components/AppShell";
import { authOptions } from "@/lib/admin/auth/authOptions";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default async function MainLayout({ children }: Readonly<MainLayoutProps>) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}
