import type { Metadata } from "next";
import { AttendanceDetailsPageContent } from "@/components/AttendanceDetailsPageContent";
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

      <AttendanceDetailsPageContent />
    </>
  );
}
