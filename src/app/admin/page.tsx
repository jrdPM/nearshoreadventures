import type { Metadata } from "next";
import { AdminReview } from "@/components/AdminReview";

export const metadata: Metadata = { title: "Review queue", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminReview />;
}
