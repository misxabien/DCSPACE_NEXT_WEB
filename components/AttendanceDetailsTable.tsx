"use client";

import { useEffect, useState } from "react";

export function AttendanceDetailsTable() {
  const [studentNumber, setStudentNumber] = useState("2025-0000");

  useEffect(() => {
    const savedStudentNumber = window.localStorage.getItem("dcspaceStudentNumber");

    if (savedStudentNumber) {
      setStudentNumber(savedStudentNumber);
    }
  }, []);

  return (
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
          <td>{studentNumber}</td>
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
  );
}
