import type { Metadata } from "next";
import AdminShell from "@/components/AdminShell";

export const metadata: Metadata = {
  title: "Админка RemTech",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminShell />;
}
