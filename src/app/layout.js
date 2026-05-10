import { Poppins } from "next/font/google";
import "./globals.css";
import { AdminShell } from "@/components/AdminShell";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "Admin Analytics",
    template: "%s · Admin Analytics",
  },
  description: "Campus admin dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
