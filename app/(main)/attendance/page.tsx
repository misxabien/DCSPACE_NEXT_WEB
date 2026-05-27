import type { Metadata } from 'next';
import { AttendancePageContent } from '@/components/AttendancePageContent';
import '@/styles/pages/attendance.css';

export const metadata: Metadata = {
  title: 'Attendance',
};

export default function AttendancePage() {
  return <AttendancePageContent />;
}
