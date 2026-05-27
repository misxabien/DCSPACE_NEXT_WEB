import { redirect } from "next/navigation";

export const metadata = {
  title: "My Profile",
};

export default function AdminSettingsPage() {
  redirect("/admin/profile");
}
