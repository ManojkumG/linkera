"use client";

import {
  BadgeCheck,
  Building2,
  MapPin,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar, Badge, Button, Card, CardBody, Field, LinkButton, Select, Spinner, Textarea } from "~/app/_components/ui";
import { experienceLabel, formatInr, workModeLabel } from "~/lib/utils";
import { api } from "~/trpc/react";

export function ListingDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const listing = api.listing.byId.useQuery({ id });

  if (listing.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-indigo-600" />
      </div>
    );
  }
  if (!listing.data) {
    return <p className="py-20 text-center text-slate-500">Referral not found.</p>;
  }

  const l = listing.data;
  const profile = l.employee.employeeProfile;
  const verified = profile?.verificationStatus === "verified";
  const rating =
    profile && profile.ratingCount > 0
      ? Math.round((profile.ratingSum / profile.ratingCount) * 10) / 10
      : null;
  const isOwner = session?.user?.id === l.employeeId;
  const isSeeker = !!session?.user && session.user.role !== "employee";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/referrals" className="text-sm text-indigo-600 hover:underline">
        ← Back to search
      </Link>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 size={20} className="text-slate-400" />
                <h1 className="text-xl font-bold text-slate-900">{l.company}</h1>
                {verified && (
                  <span title="Verified employee" className="text-indigo-600">
                    <BadgeCheck size={18} />
                  </span>
                )}
              </div>
              <p className="mt-1 text-slate-600">
                {l.jobTitle ?? l.role}
                {l.department ? ` · ${l.department}` : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">
                {formatInr(l.priceInr)}
              </p>
              <p className="text-xs text-slate-500">per referral</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge>{experienceLabel(l.experienceLevel ?? "mid")}</Badge>
            <Badge>{workModeLabel(l.workMode)}</Badge>
            {l.location && (
              <Badge>
                <MapPin size={12} /> {l.location}
              </Badge>
            )}
            <Badge color={l.slotsRemaining > 0 ? "green" : "red"}>
              <Users size={12} /> {l.slotsRemaining} slot
              {l.slotsRemaining === 1 ? "" : "s"} left this month
            </Badge>
          </div>

          {l.description && (
            <p className="whitespace-pre-wrap text-sm text-slate-700">
              {l.description}
            </p>
          )}

          {l.skills && l.skills.length > 0 && (
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">
                Relevant skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {l.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Referrer */}
      <Card>
        <CardBody className="flex items-center gap-4">
          <Avatar name={l.employee.name} src={l.employee.image} size={48} />
          <div className="flex-1">
            <p className="font-semibold text-slate-900">{l.employee.name}</p>
            <p className="text-sm text-slate-500">
              {profile?.title ?? "Employee"} at {l.company}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            {rating != null && (
              <span className="flex items-center gap-1">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                {rating}
              </span>
            )}
            <span>{profile?.totalReferred ?? 0} referred</span>
          </div>
        </CardBody>
      </Card>

      {/* Action panel */}
      {isOwner ? (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardBody className="flex items-center justify-between">
            <p className="text-sm text-indigo-800">This is your listing.</p>
            <LinkButton href="/listings" variant="outline" size="sm">
              Manage listings
            </LinkButton>
          </CardBody>
        </Card>
      ) : !session?.user ? (
        <Card>
          <CardBody className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Log in as a job seeker to request this referral.
            </p>
            <LinkButton href={`/login?next=/referrals/${id}`}>Log in</LinkButton>
          </CardBody>
        </Card>
      ) : isSeeker ? (
        <RequestPanel
          listingId={id}
          disabled={l.slotsRemaining <= 0}
          onSubmitted={(rid) => router.push(`/requests/${rid}`)}
        />
      ) : null}
    </div>
  );
}

function RequestPanel({
  listingId,
  disabled,
  onSubmitted,
}: {
  listingId: string;
  disabled: boolean;
  onSubmitted: (requestId: string) => void;
}) {
  const resumes = api.resume.list.useQuery();
  const [resumeId, setResumeId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [error, setError] = useState<string | null>(null);

  const draft = api.request.draftCoverLetter.useMutation({
    onSuccess: (text) => setCoverLetter(text),
  });
  const create = api.request.create.useMutation({
    onSuccess: (row) => row && onSubmitted(row.id),
    onError: (e) => setError(e.message),
  });

  return (
    <Card>
      <CardBody className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Request a referral
        </h2>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <Field
          label="Attach resume"
          hint={
            resumes.data?.length === 0
              ? "You have no resumes yet — upload one from the Resume page."
              : undefined
          }
        >
          <Select
            value={resumeId}
            onChange={(e) => setResumeId(e.target.value)}
          >
            <option value="">No resume</option>
            {resumes.data?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.fileName}
                {r.atsScore != null ? ` (ATS ${r.atsScore})` : ""}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Message to referrer">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Briefly introduce yourself and why you're a fit…"
          />
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Cover letter
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => draft.mutate({ listingId })}
              disabled={draft.isPending}
            >
              <Sparkles size={14} />
              {draft.isPending ? "Generating…" : "AI draft"}
            </Button>
          </div>
          <Textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Optional — generate one with AI or write your own."
            className="min-h-40"
          />
        </div>

        <Button
          className="w-full"
          disabled={disabled || create.isPending}
          onClick={() =>
            create.mutate({
              listingId,
              resumeId: resumeId || undefined,
              message: message || undefined,
              coverLetter: coverLetter || undefined,
            })
          }
        >
          {disabled
            ? "No slots available this month"
            : create.isPending
              ? "Submitting…"
              : "Submit referral request"}
        </Button>
      </CardBody>
    </Card>
  );
}
