"use client";

import { Plus } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  LinkButton,
  Spinner,
} from "~/app/_components/ui";
import { experienceLabel, formatInr, workModeLabel } from "~/lib/utils";
import { api } from "~/trpc/react";

export function ListingsManager() {
  const utils = api.useUtils();
  const listings = api.listing.mine.useQuery();
  const setActive = api.listing.setActive.useMutation({
    onSuccess: () => void utils.listing.mine.invalidate(),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My listings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage the referral opportunities you offer.
          </p>
        </div>
        <LinkButton href="/listings/new">
          <Plus size={16} /> New listing
        </LinkButton>
      </div>

      <div className="mt-6">
        {listings.isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="text-indigo-600" />
          </div>
        ) : listings.data && listings.data.length > 0 ? (
          <div className="space-y-3">
            {listings.data.map((l) => {
              const slotsLeft = Math.max(0, l.monthlyLimit - l.slotsUsedThisMonth);
              return (
                <Card key={l.id}>
                  <CardBody className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {l.role} · {l.company}
                        </h3>
                        <Badge color={l.isActive ? "green" : "slate"}>
                          {l.isActive ? "Active" : "Paused"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {experienceLabel(l.experienceLevel ?? "mid")} ·{" "}
                        {workModeLabel(l.workMode)} · {formatInr(l.priceInr)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {slotsLeft} of {l.monthlyLimit} slots left this month
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={setActive.isPending}
                        onClick={() =>
                          setActive.mutate({ id: l.id, isActive: !l.isActive })
                        }
                      >
                        {l.isActive ? "Pause" : "Activate"}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Plus size={28} />}
            title="No listings yet"
            description="Create your first referral listing to start receiving requests."
            action={<LinkButton href="/listings/new">Create listing</LinkButton>}
          />
        )}
      </div>
    </div>
  );
}
