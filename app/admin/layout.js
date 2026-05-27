import { AdminShell } from "@/components/admin/AdminShell";
import "@/styles/admin.css";

export const metadata = {
  title: {
    default: "Admin - DC Space",
    template: "%s - Admin - DC Space",
  },
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
