import { AdminLayoutGate } from "@/components/admin/AdminLayoutGate";
import "@/styles/admin.css";

export const metadata = {
  title: {
    default: "Admin - DC Space",
    template: "%s - Admin - DC Space",
  },
};

export default function AdminLayout({ children }) {
  return <AdminLayoutGate>{children}</AdminLayoutGate>;
}
