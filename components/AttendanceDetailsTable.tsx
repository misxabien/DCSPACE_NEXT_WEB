"use client";

import { useEffect, useState } from "react";
import {
  getCertificateStatus,
  getCurrentAttendanceUser,
  getRegisteredEventId,
  getSelectedAttendanceEventId,
  readRegisteredEvents,
  readUserAttendanceRecords,
  type AttendanceRecord,
  type RegisteredEvent,
} from "@/lib/attendance";

function getRequiredMinutes(minAttendance?: string) {
  if (!minAttendance) return 0;

  const lower = minAttendance.toLowerCase();

  if (lower.includes("none") || lower.includes("tba")) return 0;

  const number = Number(lower.match(/\d+(\.\d+)?/)?.[0] || 0);

  if (lower.includes("hour")) {
    return number * 60;
  }

  if (lower.includes("min")) {
    return number;
  }

  return number;
}

function getTimeMinutes(time?: string) {
  if (!time) return null;

  const date = new Date(`January 1, 2026 ${time}`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.getHours() * 60 + date.getMinutes();
}

function getAttendanceStatus(event: RegisteredEvent, record?: AttendanceRecord) {
  if (!record?.tapIn) return "Processing";
  if (!record.tapOut) return "Present";

  const tapInMinutes = getTimeMinutes(record.tapIn);
  const tapOutMinutes = getTimeMinutes(record.tapOut);

  if (tapInMinutes === null || tapOutMinutes === null) {
    return "Processing";
  }

  const attendedMinutes = tapOutMinutes - tapInMinutes;
  const requiredMinutes = getRequiredMinutes(event.minAttendance);

  if (requiredMinutes > 0 && attendedMinutes < requiredMinutes) {
    return "Undertime";
  }

  if (event.dateTime?.toLowerCase().includes("-")) {
    const eventEndTime = event.dateTime.split("-").at(-1)?.trim();
    const eventEndMinutes = getTimeMinutes(eventEndTime);

    if (eventEndMinutes !== null && tapOutMinutes > eventEndMinutes) {
      return "Overtime";
    }
  }

  return "Present";
}

export function AttendanceDetailsTable() {
  const [event, setEvent] = useState<RegisteredEvent | null>(null);
  const [record, setRecord] = useState<AttendanceRecord | undefined>();
  const [studentNumber, setStudentNumber] = useState("2025-0000");

  useEffect(() => {
    const user = getCurrentAttendanceUser();
    const registeredEvents = readRegisteredEvents();
    const selectedEventId = getSelectedAttendanceEventId();

    const selectedEvent =
      registeredEvents.find((item) => getRegisteredEventId(item) === selectedEventId) ||
      registeredEvents[0] ||
      null;

    const records = readUserAttendanceRecords(user);
    const selectedRecord = selectedEvent
      ? records[getRegisteredEventId(selectedEvent)]
      : undefined;

    setStudentNumber(user.studentNumber || "2025-0000");
    setEvent(selectedEvent);
    setRecord(selectedRecord);
  }, []);

  const attendanceStatus = event
    ? getAttendanceStatus(event, record)
    : "Processing";

  const certificateStatus = getCertificateStatus(record);

  return (
    <div className="attendance-detail-section">
      <div className="attendance-required-time">
        <span>Minimum Required Attendance Time:</span>{" "}
        <strong>{event?.minAttendance || "TBA"}</strong>
      </div>

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
            <td>{record?.eventDate || "MM/DD/YYYY"}</td>
            <td>{studentNumber}</td>
            <td>{record?.tapIn || "00-00 AM/PM"}</td>
            <td>{record?.tapOut || "00-00 AM/PM"}</td>
            <td className="col-status">{attendanceStatus}</td>
            <td className="col-cert">{certificateStatus}</td>
          </tr>

          {Array.from({ length: 5 }).map((_, index) => (
            <tr className="detail-empty-row" key={index}>
              <td colSpan={6} aria-hidden="true" />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}