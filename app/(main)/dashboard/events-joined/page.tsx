import type { Metadata } from 'next';
import { JoinedEventsPageContent } from '@/components/JoinedEventsPageContent';
import '@/styles/pages/dashboard.css';

export const metadata: Metadata = {
  title: 'Events Joined - DC Space',
};

export default function EventsJoinedPage() {
  return <JoinedEventsPageContent />;
}
