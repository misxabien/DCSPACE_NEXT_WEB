import { Poppins } from "next/font/google";
import "./login.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
  adjustFontFallback: true,
});

interface LoginLayoutProps {
  children: React.ReactNode;
}

export default function LoginLayout({ children }: Readonly<LoginLayoutProps>) {
  return <div className={`login-scope ${poppins.variable}`}>{children}</div>;
}
