import type { Metadata } from 'next';
import { EventDetailsPageContent } from '@/components/EventDetailsPageContent';
import '@/styles/pages/event-details.css';

export const metadata: Metadata = {
  title: 'Joined Event Details - DC Space',
};

export default function JoinedEventDetailsPage() {
  return <EventDetailsPageContent />;
}
