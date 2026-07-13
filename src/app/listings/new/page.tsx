import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { ListingForm } from "../listing-form";

export default async function NewListingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/listings/new");
  if (session.user.role !== "employee") redirect("/dashboard");

  const { employee } = await api.profile.mine();
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">New referral listing</h1>
      <p className="mt-1 text-sm text-slate-500">
        Publish a referral opportunity candidates can request.
      </p>
      <ListingForm defaultCompany={employee?.company ?? ""} />
    </div>
  );
}
