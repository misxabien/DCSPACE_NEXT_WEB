import { Montserrat } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "../../login/login.css";
import "./admin-login.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
  adjustFontFallback: true,
});

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className={`login-scope admin-login-scope ${montserrat.variable}`}>{children}</div>
    </SessionProvider>
  );
}
