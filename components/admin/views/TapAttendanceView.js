"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useShowStatus } from "@/contexts/ShowStatusContext";

const DEMO_STUDENTS = [
  { rfid: "2023000", studentId: "202389620", name: "Khrystelle Esplana", course: "BSIT" },
  { rfid: "2023001", studentId: "202389621", name: "Gwyneth Mucio", course: "BSIT" },
  { rfid: "2023002", studentId: "202389622", name: "Paul Cielo", course: "BSIT" },
  { rfid: "2023003", studentId: "202389623", name: "Amira Marqueses", course: "BSCS" },
  { rfid: "2023004", studentId: "202389624", name: "Misxa Germino", course: "BSIT" },
];

function formatClockTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function formatClockDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTapTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function findStudentByRfid(scan) {
  const normalized = scan.trim().toLowerCase();
  return DEMO_STUDENTS.find((s) => s.rfid.toLowerCase() === normalized) ?? null;
}

function getInitials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(target.tagName)
  );
}

export function TapAttendanceView({ eventName = "Digital Campus Ugnayan Seminar" }) {
  const showStatus = useShowStatus();
  const [now, setNow] = useState(() => new Date());
  const [activeStudent, setActiveStudent] = useState(null);
  const [tapRecords, setTapRecords] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [rfidInput, setRfidInput] = useState("");
  const scannerRef = useRef(null);
  const scanBufferRef = useRef("");
  const scanTimeoutRef = useRef(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const processScan = useCallback(
    (scannedRfid) => {
      const student = findStudentByRfid(scannedRfid);

      if (!student) {
        setActiveStudent(null);
        setStatusMessage("RFID card not recognized. Please register the card first.");
        showStatus("Unknown RFID card");
        return;
      }

      setActiveStudent(student);
      const time = formatTapTime(new Date());

      setTapRecords((prev) => {
        const existing = prev[student.rfid];

        if (!existing?.tapIn || existing.tapOut) {
          const message = `${student.name} tapped IN at ${time}.`;
          setStatusMessage(message);
          showStatus(`Tap in: ${student.name}`);
          return { ...prev, [student.rfid]: { tapIn: time, tapOut: "" } };
        }

        const message = `${student.name} tapped OUT at ${time}.`;
        setStatusMessage(message);
        showStatus(`Tap out: ${student.name}`);
        return { ...prev, [student.rfid]: { ...existing, tapOut: time } };
      });
    },
    [showStatus],
  );

  useEffect(() => {
    scannerRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || isEditableTarget(event.target)) {
        return;
      }

      if (scanTimeoutRef.current) {
        window.clearTimeout(scanTimeoutRef.current);
      }

      if (event.key === "Enter") {
        const scanned = scanBufferRef.current.trim();
        scanBufferRef.current = "";
        if (scanned) processScan(scanned);
        return;
      }

      if (event.key.length === 1) {
        scanBufferRef.current += event.key;
        scanTimeoutRef.current = window.setTimeout(() => {
          scanBufferRef.current = "";
        }, 1200);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (scanTimeoutRef.current) window.clearTimeout(scanTimeoutRef.current);
    };
  }, [processScan]);

  const handleRfidSubmit = (e) => {
    e.preventDefault();
    const scanned = rfidInput.trim();
    setRfidInput("");
    if (!scanned) return;
    processScan(scanned);
    scannerRef.current?.focus();
  };

  const activeRecord = activeStudent ? tapRecords[activeStudent.rfid] : null;
  const tableTapIn = activeRecord?.tapIn || "—";
  const tableTapOut = activeRecord?.tapOut || "—";

  return (
    <div className="tap-kiosk">
      <form className="tap-kiosk__scanner-form" onSubmit={handleRfidSubmit}>
        <input
          ref={scannerRef}
          className="tap-kiosk__scanner-input"
          type="text"
          value={rfidInput}
          onChange={(e) => setRfidInput(e.target.value)}
          autoComplete="off"
          aria-label="RFID scanner input"
        />
      </form>

      <div className="tap-kiosk__panel">
        <header className="tap-kiosk__header">
          <div className="tap-kiosk__brand">
            <Link href="/admin/events" className="tap-kiosk__back" aria-label="Back to events">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M15 18 9 12l6-6M19 12H9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <div>
              <h1 className="tap-kiosk__title">DC Space RFID</h1>
              <p className="tap-kiosk__event">{eventName}</p>
            </div>
          </div>

        </header>

        <section className="tap-kiosk__clock" aria-live="polite">
          <time className="tap-kiosk__clock-time" dateTime={now.toISOString()}>
            {formatClockTime(now)}
          </time>
          <p className="tap-kiosk__clock-date">{formatClockDate(now)}</p>
        </section>

        <div className="tap-kiosk__body">
          <aside className="tap-kiosk__profile" aria-label="Student profile">
            <div className="tap-kiosk__photo">
              {activeStudent ? (
                <span className="tap-kiosk__initials">{getInitials(activeStudent.name)}</span>
              ) : (
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
                  <path
                    d="M5 20c1.5-3.5 4.5-5 7-5s5.5 1.5 7 5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>
            <p className="tap-kiosk__student-id">{activeStudent?.studentId ?? "—"}</p>
          </aside>

          <div className="tap-kiosk__details">
            <div className="tap-kiosk__table-wrap">
              <table className="tap-kiosk__table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Course</th>
                    <th scope="col">Tap in</th>
                    <th scope="col">Tap out</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{activeStudent?.name ?? "—"}</td>
                    <td>{activeStudent?.course ?? "—"}</td>
                    <td>{tableTapIn}</td>
                    <td>{tableTapOut}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {statusMessage ? (
              <p className="tap-kiosk__status" role="status">
                {statusMessage}
              </p>
            ) : (
              <p className="tap-kiosk__status tap-kiosk__status--idle">
                Tap a card to load student details.
              </p>
            )}
          </div>
        </div>

        <footer className="tap-kiosk__footer">
          <p className="tap-kiosk__hint-sub">
            When card is scanned: first scan = Tap In, next scan = Tap Out.
          </p>
        </footer>
      </div>
    </div>
  );
}
