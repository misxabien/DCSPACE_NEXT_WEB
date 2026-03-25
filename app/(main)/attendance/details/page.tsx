import type { Metadata } from "next";
import "@/styles/pages/attendance-details.css";

export const metadata: Metadata = {
  title: "Attendance details — DC Space",
};

export default function AttendanceDetailsPage() {
  return (
    <>
      <header className="main__header">
        <div className="main__header-row">
          <h1 className="main__title">Attendance</h1>
          <div className="main__tools">
            <button type="button" className="main__tool" aria-label="Layout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="4" y="4" width="7" height="7" rx="1.5" />
                <rect x="13" y="4" width="7" height="7" rx="1.5" />
                <rect x="4" y="13" width="7" height="7" rx="1.5" />
                <rect x="13" y="13" width="7" height="7" rx="1.5" />
              </svg>
            </button>
            <button type="button" className="main__tool" aria-label="Refresh">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-2.64-6.36" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 3v6h-6" />
              </svg>
            </button>
          </div>
        </div>
        <div className="main__divider" role="presentation" />
      </header>

      <div className="details-wrap">
        <div className="details-top">
          <div className="event-block">
            <h2 className="event-block__title">Event Name</h2>
            <p className="event-block__sub">Required Attendance Time: None</p>
          </div>
        </div>

        <div className="details-table-wrap" aria-label="Attendance records">
          <table className="detail-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Student Number</th>
                <th scope="col">Tap IN</th>
                <th scope="col">Tap OUT</th>
                <th scope="col" className="col-status">
                  Attendance Requirement Status
                </th>
                <th scope="col" className="col-cert">
                  E-Certificate (Status)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>March 15, 2026</td>
                <td>2024-00123</td>
                <td>8:02 AM</td>
                <td>5:10 PM</td>
                <td className="col-status">
                  <span className="status status--complete">Complete</span>
                </td>
                <td className="col-cert">
                  <a className="btn-download" href="#" download aria-label="Download certificate">
                    Download
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M9 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                </td>
              </tr>
              <tr>
                <td>March 15, 2026</td>
                <td>2024-00124</td>
                <td>—</td>
                <td>—</td>
                <td className="col-status">
                  <span className="status status--pending">Pending</span>
                </td>
                <td className="col-cert">
                  <span className="cert-dash">—</span>
                </td>
              </tr>
              <tr>
                <td>March 15, 2026</td>
                <td>2024-00125</td>
                <td>8:45 AM</td>
                <td>—</td>
                <td className="col-status">
                  <span className="status status--incomplete">Incomplete</span>
                </td>
                <td className="col-cert">
                  <span className="cert-dash">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer className="details-footer">
          <div className="sort-pair" role="group" aria-label="Sort table">
            <button type="button">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 18h8v2H4v-2zm0-8h12v2H4v-2zm0-8h16v2H4V2z"
                  fill="currentColor"
                />
              </svg>
              Ascending
            </button>
            <button type="button">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M8 10l4-4 4 4M16 14l-4 4-4-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Descending
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}
