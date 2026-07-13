import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { ResumeManager } from "./resume-manager";

export default async function ResumePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/resume");
  return <ResumeManager />;
}
