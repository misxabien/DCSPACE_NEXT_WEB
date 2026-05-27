import "../login/login.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="login-scope">{children}</div>;
}
