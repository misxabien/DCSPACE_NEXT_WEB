import type { Metadata } from "next";
import { EventDetailsPageContent } from "@/components/EventDetailsPageContent";
import "@/styles/pages/event-details.css";

export const metadata: Metadata = {
  title: "Registered Event Details - DC Space",
};

type RegisteredEventDetailsPageProps = {
  searchParams: Promise<{
    month?: string;
    day?: string;
    year?: string;
  }>;
};

export default async function RegisteredEventDetailsPage({ searchParams }: RegisteredEventDetailsPageProps) {
  const eventDate = await searchParams;

  return <EventDetailsPageContent source="dashboard" eventDate={eventDate} />;
}
