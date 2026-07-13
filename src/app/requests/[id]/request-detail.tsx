"use client";

import { Check, FileText, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  ProgressBar,
  Spinner,
  StatusBadge,
  Textarea,
} from "~/app/_components/ui";
import {
  ALLOWED_TRANSITIONS,
  REQUEST_STATUS_LABELS,
  type RequestStatus,
  TERMINAL_STATUSES,
} from "~/lib/domain";
import { cn, experienceLabel, formatInr, timeAgo } from "~/lib/utils";
import { api } from "~/trpc/react";

const ACTION_LABELS: Record<RequestStatus, string> = {
  requested: "Reset to requested",
  viewed: "Mark viewed",
  under_review: "Mark under review",
  referred: "Refer candidate",
  accepted: "Mark accepted",
  rejected: "Reject",
  hired: "Mark hired",
};

export function RequestDetail({ id }: { id: string }) {
  const { data: session } = useSession();
  const utils = api.useUtils();
  const req = api.request.byId.useQuery({ id });
  const [note, setNote] = useState("");

  const updateStatus = api.request.updateStatus.useMutation({
    onSuccess: () => {
      setNote("");
      void utils.request.byId.invalidate({ id });
    },
  });
  const withdraw = api.request.withdraw.useMutation({
    onSuccess: () => void utils.request.byId.invalidate({ id }),
  });

  if (req.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-indigo-600" />
      </div>
    );
  }
  if (!req.data) {
    return <p className="py-20 text-center text-slate-500">Request not found.</p>;
  }

  const r = req.data;
  const isEmployee = session?.user?.id === r.employeeId;
  const counterparty = isEmployee ? r.seeker : r.employee;
  const nextActions = ALLOWED_TRANSITIONS[r.status];
  const closed = TERMINAL_STATUSES.includes(r.status);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/requests" className="text-sm text-indigo-600 hover:underline">
        ← Back to requests
      </Link>

      {/* Header */}
      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {r.listing.role} · {r.listing.company}
              </h1>
              <p className="text-sm text-slate-500">
                {r.listing.jobTitle ?? r.listing.role} ·{" "}
                {experienceLabel(r.listing.experienceLevel ?? "mid")} ·{" "}
                {formatInr(r.priceInr)}
              </p>
            </div>
            <StatusBadge status={r.status} />
          </div>
          <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
            <Avatar name={counterparty?.name} src={counterparty?.image} size={32} />
            <span className="text-sm text-slate-600">
              {isEmployee ? "Candidate" : "Referrer"}:{" "}
              <span className="font-medium text-slate-800">
                {counterparty?.name}
              </span>
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Timeline */}
      <Card>
        <CardBody>
          <h2 className="mb-4 font-semibold text-slate-900">Status</h2>
          <Timeline status={r.status} history={r.statusHistory ?? []} />
        </CardBody>
      </Card>

      {/* Success prediction (seeker view) */}
      {!isEmployee && r.successScore != null && (
        <Card>
          <CardBody className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-600" />
              <h2 className="font-semibold text-slate-900">
                Referral success prediction
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <ProgressBar value={r.successScore} className="flex-1" />
              <span className="text-sm font-semibold text-slate-900">
                {r.successScore}%
              </span>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Candidate details */}
      <Card>
        <CardBody className="space-y-4">
          <h2 className="font-semibold text-slate-900">
            {isEmployee ? "Candidate application" : "Your application"}
          </h2>

          {r.resume ? (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-slate-400" />
                <span className="text-sm text-slate-700">
                  {r.resume.fileName}
                </span>
              </div>
              {r.resume.atsScore != null && (
                <Badge color="slate">ATS {r.resume.atsScore}/100</Badge>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No resume attached.</p>
          )}

          {isEmployee && r.seekerProfile && (
            <div className="space-y-2 text-sm">
              {r.seekerProfile.headline && (
                <p className="text-slate-700">{r.seekerProfile.headline}</p>
              )}
              {r.seekerProfile.skills && r.seekerProfile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {r.seekerProfile.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {r.message && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase text-slate-500">
                Message
              </p>
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {r.message}
              </p>
            </div>
          )}
          {r.coverLetter && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase text-slate-500">
                Cover letter
              </p>
              <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                {r.coverLetter}
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Actions */}
      {isEmployee && !closed && (
        <Card>
          <CardBody className="space-y-3">
            <h2 className="font-semibold text-slate-900">Take action</h2>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note to the candidate…"
            />
            <div className="flex flex-wrap gap-2">
              {nextActions.map((s) => (
                <Button
                  key={s}
                  variant={
                    s === "rejected"
                      ? "danger"
                      : s === "referred" || s === "hired"
                        ? "primary"
                        : "outline"
                  }
                  disabled={updateStatus.isPending}
                  onClick={() =>
                    updateStatus.mutate({
                      id,
                      status: s as never,
                      note: note || undefined,
                    })
                  }
                >
                  {ACTION_LABELS[s]}
                </Button>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {!isEmployee && !closed && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            disabled={withdraw.isPending}
            onClick={() => withdraw.mutate({ id })}
          >
            Withdraw request
          </Button>
        </div>
      )}
    </div>
  );
}

function Timeline({
  status,
  history,
}: {
  status: RequestStatus;
  history: { status: RequestStatus; at: string; note?: string }[];
}) {
  // Linear happy-path stages; rejected is shown inline if reached.
  const stages: RequestStatus[] = [
    "requested",
    "viewed",
    "under_review",
    "referred",
    "hired",
  ];
  const reachedAt = new Map(history.map((h) => [h.status, h]));
  const currentIndex = stages.indexOf(status);
  const rejected = status === "rejected";

  return (
    <ol className="space-y-4">
      {stages.map((stage, i) => {
        const entry = reachedAt.get(stage);
        const reached = !!entry || (!rejected && i <= currentIndex);
        return (
          <li key={stage} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  reached
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-200 text-slate-400",
                )}
              >
                {reached ? <Check size={14} /> : i + 1}
              </span>
              {i < stages.length - 1 && (
                <span
                  className={cn(
                    "my-1 w-0.5 flex-1",
                    reached ? "bg-indigo-200" : "bg-slate-200",
                  )}
                  style={{ minHeight: 20 }}
                />
              )}
            </div>
            <div className="pb-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  reached ? "text-slate-900" : "text-slate-400",
                )}
              >
                {REQUEST_STATUS_LABELS[stage]}
              </p>
              {entry && (
                <p className="text-xs text-slate-500">
                  {timeAgo(entry.at)}
                  {entry.note ? ` · ${entry.note}` : ""}
                </p>
              )}
            </div>
          </li>
        );
      })}
      {rejected && (
        <li className="flex gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600">
            ✕
          </span>
          <div>
            <p className="text-sm font-medium text-red-700">Rejected</p>
            {reachedAt.get("rejected")?.note && (
              <p className="text-xs text-slate-500">
                {reachedAt.get("rejected")?.note}
              </p>
            )}
          </div>
        </li>
      )}
    </ol>
  );
}
