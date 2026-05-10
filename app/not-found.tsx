import type { Metadata } from "next";
import "@/styles/pages/not-found.css";

export const metadata: Metadata = {
  title: "Page not found — DC Space",
  description: "This page could not be found.",
};

export default function NotFound() {
  return (
    <section className="not-found" aria-labelledby="not-found-heading">
      <div className="not-found__inner">
        <p className="not-found__code" aria-hidden="true">
          404
        </p>
        <h1 id="not-found-heading" className="not-found__title">
          We couldn&apos;t find that page
        </h1>
        <p className="not-found__lede">The link may be broken or the page was removed.</p>
      </div>
    </section>
  );
}
