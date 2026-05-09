/**
 * Standalone script to generate a sample certificate PDF.
 * Run with: npx tsx scripts/sample-cert.ts
 */
import { generateCertificatePdf } from "../lib/admin/certificates/generate";
import { writeFileSync } from "fs";
import path from "path";

async function main() {
  const pdfBytes = await generateCertificatePdf({
    studentName: "John Doe",
    eventTitle: "IoT Exhibit",
    eventDate: "April 29, 2026",
    organizer: "DC Space Organization",
    organization: "BSIT — DOMINIXODE",
    certificateId: "DC-A1B2-C3D4-K7X9M",
  });

  const outPath = path.join(process.cwd(), "sample-certificate.pdf");
  writeFileSync(outPath, pdfBytes);
  console.log(`✅ Sample certificate saved to: ${outPath}`);
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
