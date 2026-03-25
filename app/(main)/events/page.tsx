import type { Metadata } from "next";
import { EventsPageContent } from "@/components/EventsPageContent";
import "@/styles/pages/events.css";

export const metadata: Metadata = {
  title: "Browse Events — DC Space",
};

export default function EventsPage() {
  return <EventsPageContent />;
}
