import type { Metadata } from "next";
import { MyProfileContent } from "@/components/MyProfileContent";
import "@/styles/pages/my-profile.css";

export const metadata: Metadata = {
  title: "My Profile",
};

export default function MyProfilePage() {
  return <MyProfileContent />;
}
