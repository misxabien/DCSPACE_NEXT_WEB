import { TapAttendanceView } from "@/components/admin/views/TapAttendanceView";

export const metadata = {
  title: "Tap in / Tap out",
};

export default async function AdminTapPage({ searchParams }) {
  const params = await searchParams;
  const eventName =
    typeof params?.event === "string" && params.event.trim()
      ? decodeURIComponent(params.event.trim())
      : "Digital Campus Ugnayan Seminar";
  const eventId =
    typeof params?.eventId === "string" && params.eventId.trim()
      ? params.eventId.trim()
      : "mock-digital-campus-ugnayan";

  return <TapAttendanceView eventId={eventId} eventName={eventName} />;
}
