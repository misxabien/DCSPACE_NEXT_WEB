import type { Metadata } from "next";
import { CertificatesPageContent } from "@/components/CertificatesPageContent";
import "@/styles/pages/certificates.css";

export const metadata: Metadata = {
  title: "Certificates - DC Space",
};

export default function CertificatesPage() {
  return <CertificatesPageContent />;
}
