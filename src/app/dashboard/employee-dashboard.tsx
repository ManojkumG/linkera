"use client";

import { ArrowRight, BadgeCheck, Plus, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { RolePill } from "~/app/_components/navbar";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  LinkButton,
  Select,
  Stat,
  StatusBadge,
} from "~/app/_components/ui";
import { VERIFICATION_METHODS } from "~/lib/domain";
import { formatInr, timeAgo } from "~/lib/utils";
import { api } from "~/trpc/react";

const METHOD_LABELS: Record<string, string> = {
  company_email: "Company email domain",
  work_email_otp: "Work email OTP",
  linkedin: "LinkedIn",
  manual: "Manual review",
};

export function EmployeeDashboard({ name }: { name?: string | null }) {
  const stats = api.dashboard.employee.useQuery();
  const received = api.request.received.useQuery();
  const listings = api.listing.mine.useQuery();

  const pending = received.data?.filter(
    (r) => r.status === "requested" || r.status === "viewed",
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-1">
            <RolePill role="employee" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back{name ? `, ${name.split(" ")[0]}` : ""}
          </h1>
        </div>
        <LinkButton href="/listings/new">
          <Plus size={16} /> New listing
        </LinkButton>
      </div>

      {stats.data && stats.data.verificationStatus !== "verified" && (
        <VerificationBanner
          status={stats.data.verificationStatus}
          onDone={() => stats.refetch()}
        />
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Pending" value={stats.data?.pending ?? "—"} accent="amber" />
        <Stat label="Referred" value={stats.data?.referred ?? "—"} accent="indigo" />
        <Stat label="Hired" value={stats.data?.hired ?? "—"} accent="green" />
        <Stat
          label="Success rate"
          value={stats.data?.successRate != null ? `${stats.data.successRate}%` : "—"}
        />
      </div>

      {/* Pending requests */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Requests to review
          </h2>
          <Link
            href="/requests"
            className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {pending && pending.length > 0 ? (
          <Card>
            <ul className="divide-y divide-slate-100">
              {pending.slice(0, 6).map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/requests/${r.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {r.seeker?.name ?? "Candidate"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {r.listing.role} · {r.listing.company} ·{" "}
                        {timeAgo(r.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.resume?.atsScore != null && (
                        <Badge color="slate">ATS {r.resume.atsScore}</Badge>
                      )}
                      <StatusBadge status={r.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <EmptyState
            title="No pending requests"
            description="When candidates request referrals, they'll show up here."
          />
        )}
      </section>

      {/* Listings */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">My listings</h2>
          <Link
            href="/listings"
            className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
          >
            Manage <ArrowRight size={14} />
          </Link>
        </div>
        {listings.data && listings.data.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {listings.data.slice(0, 4).map((l) => (
              <Card key={l.id}>
                <CardBody className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      {l.role} · {l.company}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatInr(l.priceInr)} ·{" "}
                      {Math.max(0, l.monthlyLimit - l.slotsUsedThisMonth)} of{" "}
                      {l.monthlyLimit} slots left
                    </p>
                  </div>
                  <Badge color={l.isActive ? "green" : "slate"}>
                    {l.isActive ? "Active" : "Paused"}
                  </Badge>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Plus size={28} />}
            title="No listings yet"
            description="Create a referral listing so candidates can request referrals from you."
            action={<LinkButton href="/listings/new">Create listing</LinkButton>}
          />
        )}
      </section>
    </div>
  );
}

function VerificationBanner({
  status,
  onDone,
}: {
  status: string;
  onDone: () => void;
}) {
  const [method, setMethod] = useState<string>("company_email");
  const [workEmail, setWorkEmail] = useState("");
  const submit = api.profile.submitVerification.useMutation({
    onSuccess: () => onDone(),
  });

  if (status === "pending") {
    return (
      <Alert variant="warning">
        <BadgeCheck size={16} className="mr-1 inline" /> Your verification is
        under review. You&apos;ll be able to list referrals once approved.
      </Alert>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardBody className="space-y-3">
        <div className="flex items-center gap-2 text-amber-800">
          <ShieldAlert size={18} />
          <h3 className="font-semibold">Verify your employer to start listing</h3>
        </div>
        <p className="text-sm text-amber-800">
          Candidates only see referrals from verified employees. Choose a method
          to verify.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="sm:max-w-xs"
          >
            {VERIFICATION_METHODS.map((m) => (
              <option key={m} value={m}>
                {METHOD_LABELS[m]}
              </option>
            ))}
          </Select>
          {(method === "company_email" || method === "work_email_otp") && (
            <input
              value={workEmail}
              onChange={(e) => setWorkEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm sm:max-w-xs"
            />
          )}
          <Button
            onClick={() =>
              submit.mutate({
                method: method as never,
                workEmail: workEmail || undefined,
              })
            }
            disabled={submit.isPending}
          >
            {submit.isPending ? "Verifying…" : "Verify now"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
