"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SkillsInput } from "~/app/_components/skills-input";
import {
  Alert,
  Button,
  Card,
  CardBody,
  Field,
  Input,
  Select,
  Textarea,
} from "~/app/_components/ui";
import { WORK_MODES } from "~/lib/domain";
import { EXPERIENCE_OPTIONS, workModeLabel } from "~/lib/utils";
import { api } from "~/trpc/react";

export function ListingForm({ defaultCompany }: { defaultCompany?: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    company: defaultCompany ?? "",
    department: "",
    role: "",
    jobTitle: "",
    location: "",
    workMode: "onsite",
    experienceLevel: "mid",
    description: "",
    priceInr: 0,
    monthlyLimit: 5,
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const create = api.listing.create.useMutation({
    onSuccess: () => {
      router.push("/listings");
      router.refresh();
    },
    onError: (e) => setError(e.message),
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <Card className="mt-6">
      <CardBody>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            create.mutate({
              ...form,
              workMode: form.workMode as never,
              experienceLevel: form.experienceLevel as never,
              priceInr: Number(form.priceInr) || 0,
              monthlyLimit: Number(form.monthlyLimit) || 1,
              skills,
            });
          }}
        >
          {error && <Alert variant="error">{error}</Alert>}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Company">
              <Input
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                required
              />
            </Field>
            <Field label="Department">
              <Input
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
                placeholder="Engineering"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Role you can refer for">
              <Input
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
                placeholder="Backend Engineer"
                required
              />
            </Field>
            <Field label="Exact job title / req">
              <Input
                value={form.jobTitle}
                onChange={(e) => set("jobTitle", e.target.value)}
                placeholder="SDE II — Payments"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Location">
              <Input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Bengaluru"
              />
            </Field>
            <Field label="Work mode">
              <Select
                value={form.workMode}
                onChange={(e) => set("workMode", e.target.value)}
              >
                {WORK_MODES.map((m) => (
                  <option key={m} value={m}>
                    {workModeLabel(m)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Experience level">
            <Select
              value={form.experienceLevel}
              onChange={(e) => set("experienceLevel", e.target.value)}
            >
              {EXPERIENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Relevant skills" hint="Helps candidates match to your listing.">
            <SkillsInput value={skills} onChange={setSkills} />
          </Field>

          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What you look for, how the referral works, timelines…"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (₹)" hint="Set 0 to offer free referrals.">
              <Input
                type="number"
                min={0}
                value={form.priceInr}
                onChange={(e) => set("priceInr", +e.target.value)}
              />
            </Field>
            <Field label="Monthly referral limit">
              <Input
                type="number"
                min={1}
                value={form.monthlyLimit}
                onChange={(e) => set("monthlyLimit", +e.target.value)}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/listings")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Publishing…" : "Publish listing"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
