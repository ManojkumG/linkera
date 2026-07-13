import { BadgeCheck, MapPin, Sparkles, Users } from "lucide-react";
import Link from "next/link";

import { Avatar, Badge, Card, CardBody } from "~/app/_components/ui";
import { experienceLabel, formatInr, workModeLabel } from "~/lib/utils";

export interface ListingCardData {
  id: string;
  company: string;
  role: string;
  jobTitle?: string | null;
  department?: string | null;
  location?: string | null;
  workMode?: string | null;
  experienceLevel?: string | null;
  priceInr: number;
  skills?: string[] | null;
  slotsRemaining?: number;
  employee?: {
    name?: string | null;
    image?: string | null;
    employeeProfile?: { verificationStatus?: string | null } | null;
  } | null;
}

export function ListingCard({
  listing,
  matchScore,
  reasons,
}: {
  listing: ListingCardData;
  matchScore?: number;
  reasons?: string[];
}) {
  const verified =
    listing.employee?.employeeProfile?.verificationStatus === "verified";

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">{listing.company}</h3>
              {verified && (
                <span title="Verified employee" className="text-indigo-600">
                  <BadgeCheck size={16} />
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600">
              {listing.jobTitle ?? listing.role}
              {listing.department ? ` · ${listing.department}` : ""}
            </p>
          </div>
          {typeof matchScore === "number" && (
            <Badge color="green">
              <Sparkles size={12} /> {matchScore}% match
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge>{experienceLabel(listing.experienceLevel ?? "mid")}</Badge>
          <Badge>{workModeLabel(listing.workMode)}</Badge>
          {listing.location && (
            <Badge>
              <MapPin size={12} /> {listing.location}
            </Badge>
          )}
          {typeof listing.slotsRemaining === "number" && (
            <Badge color={listing.slotsRemaining > 0 ? "green" : "red"}>
              <Users size={12} /> {listing.slotsRemaining} slot
              {listing.slotsRemaining === 1 ? "" : "s"} left
            </Badge>
          )}
        </div>

        {listing.skills && listing.skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {listing.skills.slice(0, 6).map((s) => (
              <span
                key={s}
                className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {reasons && reasons.length > 0 && (
          <p className="text-xs text-slate-500">{reasons.join(" · ")}</p>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2">
            <Avatar
              name={listing.employee?.name}
              src={listing.employee?.image}
              size={28}
            />
            <span className="text-sm text-slate-600">
              {listing.employee?.name ?? "Referrer"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-900">
              {formatInr(listing.priceInr)}
            </span>
            <Link
              href={`/referrals/${listing.id}`}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              View
            </Link>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
