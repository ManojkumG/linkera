import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { ListingsManager } from "./listings-manager";

export default async function ListingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/listings");
  if (session.user.role !== "employee") redirect("/dashboard");
  return <ListingsManager />;
}
