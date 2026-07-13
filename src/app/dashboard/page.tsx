import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { EmployeeDashboard } from "./employee-dashboard";
import { SeekerDashboard } from "./seeker-dashboard";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/dashboard");

  const { user } = await api.profile.mine();
  if (!user?.onboardedAt) redirect("/onboarding");

  return user.role === "employee" ? (
    <EmployeeDashboard name={user.name} />
  ) : (
    <SeekerDashboard name={user.name} />
  );
}
