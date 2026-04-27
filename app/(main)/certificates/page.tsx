import type { Metadata } from "next";
import { EmptyState } from "@/components/EmptyState";
import { SearchWithClear } from "@/components/SearchWithClear";
import "@/styles/pages/certificates.css";

export const metadata: Metadata = {
  title: "Certificates - DC Space",
};

const CERTIFICATE_GROUPS: Array<{ month: string; certificates: string[] }> = [];

function CertificateIcon() {
  return (
    <svg width="42" height="45" viewBox="0 0 42 45" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.0016 0.00323139C21.9885 -0.0297276 22.7662 0.244931 23.553 0.647763C24.549 1.1568 25.6723 2.16388 27.0594 2.80108C29.0105 3.6983 32.6215 2.46051 34.468 4.67242C35.5458 5.96148 35.5958 6.97223 35.6777 7.97198C35.7641 9.04864 36.0006 10.0411 37.3695 11.4986C39.6389 13.9156 40.1119 15.5233 38.9431 17.1968C38.1472 18.3394 36.469 18.973 36.0825 19.6981C35.2547 21.2361 36.1689 22.397 35.041 24.1915C34.2542 25.4366 33.0445 26.2569 31.4299 26.6744C30.0701 27.0259 28.7057 26.5169 27.6142 26.8868C25.6996 27.535 24.2897 29.0401 22.7662 29.421C22.1795 29.5674 21.5928 29.6407 21.0061 29.637C20.4194 29.6407 19.8328 29.5674 19.2461 29.421C17.7225 29.0401 16.3127 27.535 14.398 26.8868C13.3065 26.5169 11.9421 27.0296 10.5823 26.6744C8.96779 26.2569 7.75805 25.4366 6.97126 24.1915C5.83883 22.397 6.75296 21.2361 5.92979 19.6981C5.54321 18.973 3.86503 18.3394 3.06915 17.1968C1.89124 15.5233 2.36422 13.9156 4.63363 11.5023C6.00255 10.0447 6.23904 9.0523 6.32546 7.97564C6.40732 6.97589 6.45734 5.96515 7.5352 4.67608C9.3862 2.46417 12.9972 3.70196 14.9438 2.80475C16.3309 2.16754 17.4542 1.16046 18.4502 0.651425C19.2324 0.244931 20.0147 -0.0333897 21.0016 0.00323139ZM21.0016 9.51007L23.0299 13.5018L28.3737 13.8204L24.2852 16.6072L25.5586 20.7967L21.0016 18.5262L16.4446 20.7967L17.718 16.6072L13.6294 13.8204L18.9732 13.5018L21.0016 9.51007ZM40.4576 41.407L35.2047 40.649L32.5988 44.4063C30.7068 46.2923 29.5062 43.1905 28.9786 42.1102L23.9077 34.4088C25.0765 34.0828 26.4864 33.1417 27.9326 32.0833C30.8205 32.1309 33.5129 31.7281 35.4912 29.6993L41.3171 38.763L41.8219 39.6346C42.2221 40.7662 42.0129 41.5132 40.4576 41.407ZM1.54105 41.407L6.79844 40.649L9.40439 44.4063C11.2963 46.2923 12.497 43.1905 13.0245 42.1102L18.0955 34.4088C16.9266 34.0828 15.5168 33.1417 14.0706 32.0833C11.1826 32.1309 8.49026 31.7281 6.51192 29.6993L0.681493 38.763L0.176674 39.6346C-0.223543 40.7662 -0.0143384 41.5132 1.54105 41.407ZM20.947 5.89557C27.2231 5.89557 32.3122 9.99347 32.3122 15.0472C32.3122 20.1009 27.2231 24.1988 20.947 24.1988C14.6709 24.1988 9.58176 20.1009 9.58176 15.0472C9.58631 9.99347 14.6709 5.89557 20.947 5.89557Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function CertificatesPage() {
  const hasCertificates = CERTIFICATE_GROUPS.some((group) => group.certificates.length > 0);

  return (
    <>
      <header className="certificates-header">
        <h1 className="certificates-title">Certificates</h1>
        <div className="certificates-controls">
          <SearchWithClear className="certificates-search" role="search" />
          <div className="certificate-sort" role="group" aria-label="Sort certificates">
            <button type="button">Ascending</button>
            <button type="button">Descending</button>
          </div>
        </div>
      </header>

      <main className="certificates-content" aria-label="Certificates by event date">
        {hasCertificates ? (
          CERTIFICATE_GROUPS.map((group) => (
            <section className="certificate-month" key={group.month} aria-labelledby={`${group.month.toLowerCase()}-certificates`}>
              <h2 id={`${group.month.toLowerCase()}-certificates`}>{group.month}</h2>
              <div className="cert-grid">
                {group.certificates.map((date) => (
                  <article className="cert-card" key={date}>
                    <div className="cert-card__preview">
                      <CertificateIcon />
                    </div>
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
            </section>
          ))
        ) : (
          <EmptyState
            icon="certificate"
            message="No certificates received yet. Once you join an event and complete the required attendance, your certificates will appear here for you to view and track."
          />
        )}
      </main>
    </>
  );
}
