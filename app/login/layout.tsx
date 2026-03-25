import { Poppins } from "next/font/google";
import "./login.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
  adjustFontFallback: true,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <div className={`login-scope ${poppins.variable}`}>{children}</div>;
}
