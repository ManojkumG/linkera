import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { ProfileEditor } from "./profile-editor";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/profile");
  return <ProfileEditor role={session.user.role} />;
}
