import type { Metadata } from 'next';
import { HomePageContent } from '@/components/HomePageContent';
import '@/styles/pages/home.css';

export const metadata: Metadata = {
  title: 'Home | DC Space',
};

export default function HomePage() {
  return <HomePageContent />;
}
