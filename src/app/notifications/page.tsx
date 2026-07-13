import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { NotificationsList } from "./notifications-list";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/notifications");
  return <NotificationsList />;
}
