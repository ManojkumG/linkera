"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { ListingCard } from "~/app/_components/listing-card";
import {
  Button,
  Card,
  CardBody,
  EmptyState,
  Field,
  Input,
  Select,
  Spinner,
} from "~/app/_components/ui";
import { WORK_MODES } from "~/lib/domain";
import { EXPERIENCE_OPTIONS, workModeLabel } from "~/lib/utils";
import { api } from "~/trpc/react";

const PAGE_SIZE = 12;

export default function ReferralsPage() {
  const [draft, setDraft] = useState("");
  const [filters, setFilters] = useState({
    query: "",
    company: "",
    location: "",
    workMode: "",
    experienceLevel: "",
    maxPrice: "",
    availableOnly: true,
  });
  const [page, setPage] = useState(0);

  const search = api.listing.search.useQuery({
    query: filters.query ?? undefined,
    company: filters.company || undefined,
    location: filters.location || undefined,
    workMode: (filters.workMode || undefined) as never,
    experienceLevel: (filters.experienceLevel || undefined) as never,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    availableOnly: filters.availableOnly,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  function update<K extends keyof typeof filters>(
    key: K,
    value: (typeof filters)[K],
  ) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(0);
  }

  const total = search.data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Find referrals</h1>
      <p className="mt-1 text-sm text-slate-500">
        Search verified employees open to referring candidates.
      </p>

      {/* Search bar */}
      <form
        className="mt-5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          update("query", draft);
        }}
      >
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search by company, role, or title…"
            className="pl-10"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Filters */}
        <aside>
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center gap-2 text-slate-700">
                <SlidersHorizontal size={16} />
                <span className="font-semibold">Filters</span>
              </div>
              <Field label="Company">
                <Input
                  value={filters.company}
                  onChange={(e) => update("company", e.target.value)}
                  placeholder="Any company"
                />
              </Field>
              <Field label="Location">
                <Input
                  value={filters.location}
                  onChange={(e) => update("location", e.target.value)}
                  placeholder="Any location"
                />
              </Field>
              <Field label="Work mode">
                <Select
                  value={filters.workMode}
                  onChange={(e) => update("workMode", e.target.value)}
                >
                  <option value="">Any</option>
                  {WORK_MODES.map((m) => (
                    <option key={m} value={m}>
                      {workModeLabel(m)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Experience level">
                <Select
                  value={filters.experienceLevel}
                  onChange={(e) => update("experienceLevel", e.target.value)}
                >
                  <option value="">Any</option>
                  {EXPERIENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Max price (₹)">
                <Input
                  type="number"
                  min={0}
                  value={filters.maxPrice}
                  onChange={(e) => update("maxPrice", e.target.value)}
                  placeholder="No limit"
                />
              </Field>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={filters.availableOnly}
                  onChange={(e) => update("availableOnly", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Available slots only
              </label>
            </CardBody>
          </Card>
        </aside>

        {/* Results */}
        <div>
          <p className="mb-3 text-sm text-slate-500">
            {search.isLoading ? "Searching…" : `${total} referral${total === 1 ? "" : "s"} found`}
          </p>
          {search.isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner className="text-indigo-600" />
            </div>
          ) : search.data && search.data.items.length > 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {search.data.items.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-slate-500">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={<Search size={28} />}
              title="No referrals match your filters"
              description="Try widening your search or clearing some filters."
            />
          )}
        </div>
      </div>
    </div>
  );
}
