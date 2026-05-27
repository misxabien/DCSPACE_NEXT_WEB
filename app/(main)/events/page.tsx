import type { Metadata } from 'next';
import { SavedEventsPageContent } from '@/components/SavedEventsPageContent';
import '@/styles/pages/saved-events.css';

export const metadata: Metadata = {
  title: 'My Saved Events - DC Space',
};

export default function EventsPage() {
  return <SavedEventsPageContent />;
}
