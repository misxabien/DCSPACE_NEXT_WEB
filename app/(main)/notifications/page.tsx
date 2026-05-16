import type { Metadata } from "next";
import { NotificationsPageContent } from "@/components/NotificationsPageContent";
import "@/styles/pages/notifications.css";

export const metadata: Metadata = {
  title: "Notifications - DC Space",
};

export default function NotificationsPage() {
  return <NotificationsPageContent />;
}
