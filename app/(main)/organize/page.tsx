import type { Metadata } from "next";
import { OrganizeForm } from "@/components/OrganizeForm";
import "@/styles/pages/organize.css";

export const metadata: Metadata = {
  title: "Organize — DC Space",
};

export default function OrganizePage() {
  return (
    <>
      <header className="organize-header">
        <div className="organize-header__row">
          <div className="organize-header__titles">
            <h1>Organize an Event!</h1>
            <p>
              Before creating an event, please complete all required details in the form. Make sure the information is
              accurate to ensure proper scheduling and participant registration.
            </p>
          </div>
          <div className="main__tools">
            <button type="button" className="main__tool" aria-label="Copy template">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
                <path
                  strokeLinejoin="round"
                  d="M8 6h10a2 2 0 012 2v12a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z"
                />
                <path strokeLinejoin="round" d="M6 4H5a2 2 0 00-2 2v11a2 2 0 002 2h1" />
                <path strokeLinecap="round" d="M10 10h6M10 14h6" />
              </svg>
            </button>
            <button type="button" className="main__tool" aria-label="Refresh">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-2.64-6.36" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 3v6h-6" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      <div className="organize-divider" role="presentation" />

      <div className="main__grid-wrap">
        <OrganizeForm />
      </div>
    </>
  );
}
