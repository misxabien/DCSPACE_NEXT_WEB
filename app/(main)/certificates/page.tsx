import type { Metadata } from "next";
import "@/styles/pages/certificates.css";

export const metadata: Metadata = {
  title: "My Certificates — DC Space",
};

const CERTS = [
  "March 15, 2026",
  "March 20, 2026",
  "April 2, 2026",
  "April 10, 2026",
  "May 5, 2026",
  "May 18, 2026",
];

function CertBadge() {
  return (
    <div className="cert-card__badge" aria-hidden>
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" role="img">
        <rect x="16" y="10" width="32" height="40" rx="4" fill="currentColor" />
        <rect x="21" y="16" width="22" height="2.5" rx="1.25" fill="#fdf5e6" />
        <rect x="21" y="22" width="16" height="2.5" rx="1.25" fill="#fdf5e6" />
        <circle cx="32" cy="35" r="6" fill="#fdf5e6" />
        <path d="M29 40l-2 8 5-3 5 3-2-8" fill="#fdf5e6" />
      </svg>
    </div>
  );
}

export default function CertificatesPage() {
  return (
    <>
      <header className="main__header">
        <div className="main__header-row">
          <h1 className="main__title">My Certificates</h1>
          <div className="main__tools">
            <button type="button" className="main__tool" aria-label="Scan or focus">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <circle cx="12" cy="12" r="4" />
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

      <div className="main__grid-wrap">
        <div className="cert-grid" aria-label="Your certificates">
          {CERTS.map((date) => (
            <article key={date} className="cert-card">
              <CertBadge />
              <div className="cert-card__divider" role="presentation" />
              <div className="cert-card__footer">
                <div>
                  <p className="cert-card__title">Event Name Certificate</p>
                  <p className="cert-card__date">Issued Date: {date}</p>
                </div>
                <button type="button" className="cert-card__view">
                  View
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
