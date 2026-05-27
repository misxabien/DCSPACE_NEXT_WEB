import type { Metadata } from 'next';
import { EventsOrganizedPageContent } from '@/components/EventsOrganizedPageContent';
import '@/styles/pages/events-organized.css';

export const metadata: Metadata = {
  title: 'My Organized Events | DC Space',
};

export default function EventsOrganizedPage() {
  return <EventsOrganizedPageContent />;
}
