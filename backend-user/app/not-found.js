export default function NotFound() {
  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>Not found</h1>
      <p style={{ marginBottom: "1rem" }}>This route does not exist.</p>
      <a href="/api/health">Open health check</a>
    </main>
  );
}
