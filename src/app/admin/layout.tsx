import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin • LinkErra",
  description: "Referral administration portal for reviewing analytics and outreach activity.",
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
