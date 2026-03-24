import type { Metadata } from "next";
import "@/styles/pages/hover.css";

export const metadata: Metadata = {
  title: "Event Details — DC Space",
};

export default function HoverPage() {
  return (
    <>
      <header className="main__header">
        <div className="main__header-row">
          <h1 className="main__title">Dashboard</h1>
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
      </header>

      <section className="content">
        <h2 className="upcoming">Upcoming Event</h2>
        <div className="tag">PUBMAT</div>

        <div className="event-block">
          <div className="calendar" aria-hidden>
            <svg viewBox="0 0 64 64">
              <rect x="6" y="10" width="52" height="48" rx="5" />
              <rect x="6" y="20" width="52" height="7" rx="1" />
              <rect x="18" y="5" width="6" height="14" rx="3" />
              <rect x="40" y="5" width="6" height="14" rx="3" />
              <rect x="14" y="33" width="8" height="8" rx="1.5" />
              <rect x="28" y="33" width="8" height="8" rx="1.5" />
              <rect x="42" y="33" width="8" height="8" rx="1.5" />
              <rect x="14" y="45" width="8" height="8" rx="1.5" />
              <rect x="28" y="45" width="8" height="8" rx="1.5" />
              <rect x="42" y="45" width="8" height="8" rx="1.5" />
            </svg>
          </div>

          <div className="event-main">
            <h2>Name of Event</h2>
            <div className="meta">
              <div className="meta-row">
                <svg viewBox="0 0 24 24">
                  <rect x="3" y="5" width="18" height="16" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="8" y1="3" x2="8" y2="7" />
                  <line x1="16" y1="3" x2="16" y2="7" />
                </svg>
                Event Date
              </div>
              <div className="meta-row">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="8" />
                  <path d="M12 8v4l2.8 1.8" />
                </svg>
                Event Time Start and End
              </div>
              <div className="meta-row">
                <svg viewBox="0 0 24 24">
                  <path d="M12 21s6-5.7 6-10a6 6 0 1 0-12 0c0 4.3 6 10 6 10Z" />
                  <circle cx="12" cy="11" r="2.4" />
                </svg>
                Event Venue
              </div>
            </div>

            <p className="description">
              Last week, our school held a successful technology seminar that brought together students
              and professionals to learn about the latest trends in innovation. The event featured several
              guest speakers who shared their experiences in the field of information technology, providing
              valuable insights and practical advice. Participants were actively engaged through interactive
              discussions and hands-on activities, making the seminar both informative and enjoyable.
              Overall, the event not only enhanced our knowledge but also inspired many students to pursue
              careers in the tech industry.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
