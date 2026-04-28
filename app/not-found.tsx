import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Page not found</h1>
      <Link href="/dashboard">Return to dashboard</Link>
    </main>
  );
}
