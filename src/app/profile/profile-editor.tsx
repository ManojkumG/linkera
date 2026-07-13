"use client";

import { useEffect, useState } from "react";

import { SkillsInput } from "~/app/_components/skills-input";
import {
  Alert,
  Button,
  Card,
  CardBody,
  Field,
  Input,
  Select,
  Spinner,
  Textarea,
} from "~/app/_components/ui";
import { type UserRole, WORK_MODES } from "~/lib/domain";
import { EXPERIENCE_OPTIONS, workModeLabel } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";

type MineOutput = RouterOutputs["profile"]["mine"];

export function ProfileEditor({ role }: { role: UserRole }) {
  const mine = api.profile.mine.useQuery();

  if (mine.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Your profile</h1>
      <p className="mt-1 text-sm text-slate-500">
        {role === "employee"
          ? "Keep your employer details current so candidates trust your listings."
          : "A complete profile means better AI matches and stronger referrals."}
      </p>
      {role === "employee" ? (
        <EmployeeEditor initial={mine.data?.employee} />
      ) : (
        <SeekerEditor initial={mine.data?.seeker} />
      )}
    </div>
  );
}

function Saved({ show }: { show: boolean }) {
  if (!show) return null;
  return <Alert variant="success">Profile saved.</Alert>;
}

function SeekerEditor({ initial }: { initial: MineOutput["seeker"] }) {
  const utils = api.useUtils();
  const [saved, setSaved] = useState(false);
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("entry");
  const [yearsExperience, setYearsExperience] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [careerGoals, setCareerGoals] = useState("");

  useEffect(() => {
    if (!initial) return;
    setHeadline(initial.headline ?? "");
    setLocation(initial.location ?? "");
    setExperienceLevel(initial.experienceLevel ?? "entry");
    setYearsExperience(initial.yearsExperience ?? 0);
    setSkills(initial.skills ?? []);
    setCareerGoals(initial.careerGoals ?? "");
  }, [initial]);

  const save = api.profile.updateSeeker.useMutation({
    onSuccess: () => {
      setSaved(true);
      void utils.profile.mine.invalidate();
      setTimeout(() => setSaved(false), 2500);
    },
  });

  return (
    <Card className="mt-6">
      <CardBody>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({
              headline,
              location,
              experienceLevel: experienceLevel as never,
              yearsExperience: Number(yearsExperience) || 0,
              skills,
              careerGoals,
            });
          }}
        >
          <Saved show={saved} />
          <Field label="Headline">
            <Input value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location">
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
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
          <Field label="Skills">
            <SkillsInput value={skills} onChange={setSkills} />
          </Field>
          <Field label="Career goals">
            <Textarea
              value={careerGoals}
              onChange={(e) => setCareerGoals(e.target.value)}
            />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

function EmployeeEditor({ initial }: { initial: MineOutput["employee"] }) {
  const utils = api.useUtils();
  const [saved, setSaved] = useState(false);
  const [company, setCompany] = useState("");
  const [department, setDepartment] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState("onsite");
  const [experienceLevel, setExperienceLevel] = useState("mid");
  const [bio, setBio] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  useEffect(() => {
    if (!initial) return;
    setCompany(initial.company ?? "");
    setDepartment(initial.department ?? "");
    setTitle(initial.title ?? "");
    setLocation(initial.location ?? "");
    setWorkMode(initial.workMode ?? "onsite");
    setExperienceLevel(initial.experienceLevel ?? "mid");
    setBio(initial.bio ?? "");
    setLinkedinUrl(initial.linkedinUrl ?? "");
  }, [initial]);

  const save = api.profile.updateEmployee.useMutation({
    onSuccess: () => {
      setSaved(true);
      void utils.profile.mine.invalidate();
      setTimeout(() => setSaved(false), 2500);
    },
  });

  return (
    <Card className="mt-6">
      <CardBody>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({
              company,
              department,
              title,
              location,
              workMode: workMode as never,
              experienceLevel: experienceLevel as never,
              bio,
              linkedinUrl: linkedinUrl || undefined,
            });
          }}
        >
          <Saved show={saved} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company">
              <Input value={company} onChange={(e) => setCompany(e.target.value)} required />
            </Field>
            <Field label="Department">
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Location">
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Work mode">
              <Select value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
                {WORK_MODES.map((m) => (
                  <option key={m} value={m}>
                    {workModeLabel(m)}
                  </option>
                ))}
              </Select>
            </Field>
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
          </div>
          <Field label="LinkedIn URL">
            <Input
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/…"
            />
          </Field>
          <Field label="Bio">
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
