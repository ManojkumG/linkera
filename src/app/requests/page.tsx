"use client";

import { Inbox } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

import {
  Badge,
  Card,
  EmptyState,
  LinkButton,
  Spinner,
  StatusBadge,
} from "~/app/_components/ui";
import { Avatar } from "~/app/_components/ui";
import {
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  type RequestStatus,
} from "~/lib/domain";
import { cn, timeAgo } from "~/lib/utils";
import { api } from "~/trpc/react";

export default function RequestsPage() {
  const { data: session, status } = useSession();
  const isEmployee = session?.user?.role === "employee";
  const [filter, setFilter] = useState<RequestStatus | "all">("all");

  const sent = api.request.sent.useQuery(undefined, {
    enabled: status === "authenticated" && !isEmployee,
  });
  const received = api.request.received.useQuery(undefined, {
    enabled: status === "authenticated" && isEmployee,
  });

  const source = isEmployee ? received : sent;
  const items = (source.data ?? []).filter(
    (r) => filter === "all" || r.status === filter,
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">
        {isEmployee ? "Referral requests" : "My requests"}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {isEmployee
          ? "Review and act on candidates who requested referrals from you."
          : "Track the status of every referral you've requested."}
      </p>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap gap-2">
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="All"
        />
        {REQUEST_STATUSES.map((s) => (
          <FilterChip
            key={s}
            active={filter === s}
            onClick={() => setFilter(s)}
            label={REQUEST_STATUS_LABELS[s]}
          />
        ))}
      </div>

      <div className="mt-5">
        {source.isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="text-indigo-600" />
          </div>
        ) : items.length > 0 ? (
          <Card>
            <ul className="divide-y divide-slate-100">
              {items.map((r) => {
                const counterparty = isEmployee
                  ? "seeker" in r
                    ? r.seeker
                    : null
                  : "employee" in r
                    ? r.employee
                    : null;
                return (
                  <li key={r.id}>
                    <Link
                      href={`/requests/${r.id}`}
                      className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50"
                    >
                      <Avatar
                        name={counterparty?.name}
                        src={counterparty?.image}
                        size={40}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-900">
                          {r.listing.role} · {r.listing.company}
                        </p>
                        <p className="text-xs text-slate-500">
                          {isEmployee ? "from" : "to"}{" "}
                          {counterparty?.name ?? "user"} · {timeAgo(r.createdAt)}
                        </p>
                      </div>
                      {"successScore" in r && r.successScore != null && (
                        <Badge color="slate">{r.successScore}% likely</Badge>
                      )}
                      <StatusBadge status={r.status} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        ) : (
          <EmptyState
            icon={<Inbox size={28} />}
            title="Nothing here yet"
            description={
              isEmployee
                ? "Requests from candidates will appear here."
                : "Browse referrals and send your first request."
            }
            action={
              !isEmployee ? (
                <LinkButton href="/referrals">Browse referrals</LinkButton>
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-sm font-medium transition-colors",
        active
          ? "bg-indigo-600 text-white"
          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
      )}
    >
      {label}
    </button>
  );
}
