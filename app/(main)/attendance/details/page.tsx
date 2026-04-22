import type { Metadata } from "next";
import Link from "next/link";
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
          <table className="detail-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Student No.</th>
                <th scope="col">Tap IN</th>
                <th scope="col">Tap OUT</th>
                <th scope="col" className="col-status">
                  Attendance<br />Requirement Status
                </th>
                <th scope="col" className="col-cert">
                  E-Certificate<br />Status
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>MM/DD/YYYY</td>
                <td>2025-0000</td>
                <td>00-00 AM/PM</td>
                <td>00-00 AM/PM</td>
                <td className="col-status">Processing</td>
                <td className="col-cert">Processing</td>
              </tr>
              {Array.from({ length: 5 }).map((_, index) => (
                <tr className="detail-empty-row" key={index}>
                  <td colSpan={6} aria-hidden="true" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
