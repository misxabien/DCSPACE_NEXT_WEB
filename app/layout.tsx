import type { Metadata } from "next";
import { Montserrat, Poppins } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-montserrat",
  display: "swap",
  adjustFontFallback: true,
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-poppins",
  display: "swap",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "DC Space",
  description: "TAP. ATTEND. GET CERTIFIED.",
  icons: {
    icon: {
      url: "/dcspace-logo-circle.png",
      type: "image/png",
      sizes: "32x32",
    },
    shortcut: "/dcspace-logo-circle.png",
    apple: {
      url: "/dcspace-logo-circle.png",
      type: "image/png",
      sizes: "180x180",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${poppins.variable} ${poppins.className}`}>
        {children}
      </body>
    </html>
  );
}
