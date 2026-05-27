import type { Metadata } from 'next';
import { SavedEventsPageContent } from '@/components/SavedEventsPageContent';
import '@/styles/pages/saved-events.css';

export const metadata: Metadata = {
  title: 'Browse Events',
};

export default function EventsPage() {
  return <SavedEventsPageContent />;
}
