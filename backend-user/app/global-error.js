"use client";

export default function GlobalError({ error }) {
  return (
    <html lang="en">
      <body>
        <main style={{ padding: "2rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>Application error</h1>
          <p style={{ marginBottom: "1rem" }}>{error?.message || "Unexpected error occurred."}</p>
          <a href="/api/health">Open health check</a>
        </main>
      </body>
    </html>
  );
}
