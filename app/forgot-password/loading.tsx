import { BrandedLoading } from "@/components/BrandedLoading";

export default function Loading() {
  return (
    <div className="login-scope">
      <BrandedLoading label="Loading password reset..." />
    </div>
  );
}
