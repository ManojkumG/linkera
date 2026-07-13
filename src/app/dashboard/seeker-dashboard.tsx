"use client";

import { ArrowRight, FileText, Search, Sparkles } from "lucide-react";
import Link from "next/link";

import { ListingCard } from "~/app/_components/listing-card";
import { RolePill } from "~/app/_components/navbar";
import {
  Card,
  EmptyState,
  LinkButton,
  Spinner,
  Stat,
  StatusBadge,
} from "~/app/_components/ui";
import { timeAgo } from "~/lib/utils";
import { api } from "~/trpc/react";

export function SeekerDashboard({ name }: { name?: string | null }) {
  const stats = api.dashboard.seeker.useQuery();
  const recs = api.dashboard.recommendations.useQuery();
  const sent = api.request.sent.useQuery();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-1">
            <RolePill role="seeker" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back{name ? `, ${name.split(" ")[0]}` : ""}
          </h1>
        </div>
        <LinkButton href="/referrals">
          <Search size={16} /> Find referrals
        </LinkButton>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total requests" value={stats.data?.total ?? "—"} />
        <Stat label="Active" value={stats.data?.active ?? "—"} accent="indigo" />
        <Stat label="Referred" value={stats.data?.referred ?? "—"} accent="amber" />
        <Stat label="Hired" value={stats.data?.hired ?? "—"} accent="green" />
      </div>

      {/* Recommendations */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            Recommended for you
          </h2>
        </div>
        {recs.isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner className="text-indigo-600" />
          </div>
        ) : recs.data && recs.data.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {recs.data.map((m) => (
              <ListingCard
                key={m.listingId}
                listing={m.listing}
                matchScore={m.score}
                reasons={m.reasons}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Search size={28} />}
            title="No recommendations yet"
            description="Add skills to your profile or upload a resume so we can match you with referrers."
            action={
              <LinkButton href="/resume" variant="outline">
                <FileText size={16} /> Upload resume
              </LinkButton>
            }
          />
        )}
      </section>

      {/* Recent requests */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent requests
          </h2>
          <Link
            href="/requests"
            className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {sent.data && sent.data.length > 0 ? (
          <Card>
            <ul className="divide-y divide-slate-100">
              {sent.data.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/requests/${r.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {r.listing.role} · {r.listing.company}
                      </p>
                      <p className="text-xs text-slate-500">
                        to {r.employee?.name ?? "referrer"} · {timeAgo(r.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <EmptyState
            title="No requests yet"
            description="Browse referrals and send your first request."
            action={<LinkButton href="/referrals">Browse referrals</LinkButton>}
          />
        )}
      </section>
    </div>
  );
}
