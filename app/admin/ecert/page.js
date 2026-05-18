import { EcertView } from "@/components/admin/views/EcertView";

export const metadata = {
  title: "E-Certificate & Attendance",
};

export default async function AdminEcertPage({ searchParams }) {
  const params = await searchParams;
  const openAttendance = params?.view === "attendance";

  return <EcertView openAttendance={openAttendance} />;
}
