import type { Metadata } from 'next';
import { AttendanceDetailsPageContent } from '@/components/AttendanceDetailsPageContent';
import '@/styles/pages/attendance-details.css';

export const metadata: Metadata = {
  title: 'Attendance details - DC Space',
};

export default function AttendanceDetailsPage() {
  return <AttendanceDetailsPageContent />;
}
