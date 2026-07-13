import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/onboarding");
  return <OnboardingForm initialRole={session.user.role} />;
}
