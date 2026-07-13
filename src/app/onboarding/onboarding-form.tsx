"use client";

import { Briefcase, User } from "lucide-react";
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
import { cn, EXPERIENCE_OPTIONS, workModeLabel } from "~/lib/utils";
import { api } from "~/trpc/react";

type Role = "seeker" | "employee";

export function OnboardingForm({ initialRole }: { initialRole: Role | "admin" }) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(
    initialRole === "employee" ? "employee" : "seeker",
  );
  const [error, setError] = useState<string | null>(null);

  // Seeker fields
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("entry");
  const [yearsExperience, setYearsExperience] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [careerGoals, setCareerGoals] = useState("");

  // Employee fields
  const [company, setCompany] = useState("");
  const [department, setDepartment] = useState("");
  const [title, setTitle] = useState("");
  const [workMode, setWorkMode] = useState("onsite");

  const complete = api.profile.completeOnboarding.useMutation({
    onSuccess: () => {
      router.push("/dashboard");
      router.refresh();
    },
    onError: (e) => setError(e.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (role === "seeker") {
      complete.mutate({
        role: "seeker",
        seeker: {
          headline,
          location,
          experienceLevel: experienceLevel as never,
          yearsExperience: Number(yearsExperience) || 0,
          skills,
          careerGoals,
        },
      });
    } else {
      if (!company.trim()) {
        setError("Company is required.");
        return;
      }
      complete.mutate({
        role: "employee",
        employee: {
          company,
          department,
          title,
          location,
          workMode: workMode as never,
          experienceLevel: experienceLevel as never,
          yearsExperience: Number(yearsExperience) || 0,
        },
      });
    }
  }

  return (
    <div className="mx-auto max-w-xl py-4">
      <h1 className="text-2xl font-bold text-slate-900">
        Let&apos;s set up your profile
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        This helps us match you with the right {role === "seeker" ? "referrals" : "candidates"}.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <RoleTile
          active={role === "seeker"}
          onClick={() => setRole("seeker")}
          icon={<User size={18} />}
          title="Job seeker"
          subtitle="Looking for referrals"
        />
        <RoleTile
          active={role === "employee"}
          onClick={() => setRole("employee")}
          icon={<Briefcase size={18} />}
          title="Referrer"
          subtitle="Can refer candidates"
        />
      </div>

      <Card className="mt-4">
        <CardBody>
          <form className="space-y-4" onSubmit={submit}>
            {error && <Alert variant="error">{error}</Alert>}

            {role === "seeker" ? (
              <>
                <Field label="Headline">
                  <Input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Frontend Engineer • React, TypeScript"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Location">
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Bengaluru"
                    />
                  </Field>
                  <Field label="Years of experience">
                    <Input
                      type="number"
                      min={0}
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(+e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="Experience level">
                  <Select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                  >
                    {EXPERIENCE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Skills" hint="Press Enter after each skill.">
                  <SkillsInput value={skills} onChange={setSkills} />
                </Field>
                <Field label="Career goals">
                  <Textarea
                    value={careerGoals}
                    onChange={(e) => setCareerGoals(e.target.value)}
                    placeholder="What roles or companies are you targeting?"
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Company">
                  <Input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Corp"
                    required
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Department">
                    <Input
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Engineering"
                    />
                  </Field>
                  <Field label="Your title">
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Senior Software Engineer"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Location">
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Hyderabad"
                    />
                  </Field>
                  <Field label="Work mode">
                    <Select
                      value={workMode}
                      onChange={(e) => setWorkMode(e.target.value)}
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
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                  >
                    {EXPERIENCE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Alert variant="info">
                  After this, verify your employer from your dashboard to start
                  listing referrals.
                </Alert>
              </>
            )}

            <Button type="submit" className="w-full" disabled={complete.isPending}>
              {complete.isPending ? "Saving…" : "Finish setup"}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

function RoleTile({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
        active
          ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
          : "border-slate-200 hover:border-slate-300",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-md",
          active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600",
        )}
      >
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold text-slate-900">
          {title}
        </span>
        <span className="block text-xs text-slate-500">{subtitle}</span>
      </span>
    </button>
  );
}
