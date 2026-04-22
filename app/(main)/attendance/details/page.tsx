import type { Metadata } from "next";
import Link from "next/link";
import { AttendanceDetailsTable } from "@/components/AttendanceDetailsTable";
import { SearchWithClear } from "@/components/SearchWithClear";
import "@/styles/pages/attendance-details.css";

export const metadata: Metadata = {
  title: "Attendance details - DC Space",
};

export default function AttendanceDetailsPage() {
  return (
    <>
      <header className="main__header">
        <div className="main__header-row">
          <h1 className="main__title">Attendance</h1>
          <SearchWithClear className="attendance-search" role="search" />
        </div>
      </header>

      <div className="details-wrap">
        <div className="details-top">
          <div className="event-block">
            <h2 className="event-block__title">Event Name</h2>
            <p className="event-block__sub">Required Attendance Time:</p>
          </div>

          <Link href="/attendance" className="details-back">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19 6L13 12L19 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Go Back
          </Link>
        </div>

        <div className="details-table-wrap" aria-label="Attendance records">
          <AttendanceDetailsTable />
        </div>
      </div>
    </>
  );
}
