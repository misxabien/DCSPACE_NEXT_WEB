import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import '@/styles/pages/organize.css';

export const metadata: Metadata = {
  title: 'Organize',
};

export default function OrganizePage() {
  redirect('/events-organized/create');
}
