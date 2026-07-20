"use client";

import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  LayoutGrid,
  LogOut,
  Mail,
  PlusCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  Button,
  Card,
  CardBody,
  Field,
  Input,
  Select,
  Textarea,
} from "~/app/_components/ui";

type View = "overview" | "verification" | "requests" | "analytics" | "provide-referral";
type Mode = "signup" | "login";

type AdminProfile = {
  name: string;
  company: string;
  companyEmail: string;
  employeeId: string;
  password: string;
  access: "pending" | "granted";
};

const navItems: Array<{ id: View; label: string; icon: React.ReactNode }> = [
  { id: "overview", label: "Dashboard", icon: <LayoutGrid size={16} /> },
  { id: "verification", label: "Verify employees", icon: <ShieldCheck size={16} /> },
  { id: "requests", label: "Referral requests", icon: <Users size={16} /> },
  { id: "analytics", label: "Analytics", icon: <BriefcaseBusiness size={16} /> },
];

const queueItems = [
  { name: "Aarav Mehta", company: "Microsoft", email: "aarav@microsoftexample.com", status: "Awaiting review" },
  { name: "Priya Nair", company: "Google", email: "priya@googleexample.com", status: "Needs company email" },
  { name: "Daniel Cruz", company: "Stripe", email: "daniel@stripeexample.com", status: "Verified" },
];

export default function AdminPage() {
  const [mode, setMode] = useState<Mode>("signup");
  const [view, setView] = useState<View>("overview");
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [form, setForm] = useState({
    name: "",
    company: "",
    companyEmail: "",
    employeeId: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [referral, setReferral] = useState({
    jobTitle: "", jobId: "", department: "", employmentType: "", workMode: "", jobLocation: "",
    referralLink: "", applicationDeadline: "", numberOfOpenings: "", experienceRequired: "",
    requiredSkills: "", minimumQualification: "", salaryRange: "", jobDescription: "",
    resumeRequired: "Yes", additionalInstructions: "", preferredContactMethod: "Email", phone: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("linkerra-admin-profile");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AdminProfile;
        setProfile(parsed);
      } catch {
        window.localStorage.removeItem("linkerra-admin-profile");
      }
    }
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!form.name || !form.company || !form.companyEmail || !form.employeeId || !form.password) {
      setError("Please complete every field before continuing.");
      return;
    }

    if (!form.companyEmail.includes("@")) {
      setError("Please enter a valid company email address.");
      return;
    }

    if (form.companyEmail.includes("@gmail.com") || form.companyEmail.includes("@yahoo.com")) {
      setError("Only company-issued email addresses are allowed for this portal.");
      return;
    }

    const nextProfile: AdminProfile = {
      name: form.name,
      company: form.company,
      companyEmail: form.companyEmail,
      employeeId: form.employeeId,
      password: form.password,
      access: "pending",
    };

    window.localStorage.setItem("linkerra-admin-profile", JSON.stringify(nextProfile));
    setProfile(nextProfile);
    setMessage("Access request captured. Your company email and employee ID will be reviewed before you receive full admin access.");
  };

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!form.companyEmail || !form.password) {
      setError("Enter your company email and password to continue.");
      return;
    }

    const saved = window.localStorage.getItem("linkerra-admin-profile");
    if (!saved) {
      setError("No access request was found for that company email. Please create an account first.");
      return;
    }

    const parsed = JSON.parse(saved) as AdminProfile;
    if (parsed.companyEmail !== form.companyEmail) {
      setError("That company email does not match the existing admin access record.");
      return;
    }

    if (parsed.password !== form.password) {
      setError("The password you entered does not match the admin access record.");
      return;
    }

    const nextProfile = { ...parsed, access: "granted" as const };
    window.localStorage.setItem("linkerra-admin-profile", JSON.stringify(nextProfile));
    setProfile(nextProfile);
    setMessage("Welcome back. Your company-based access has been restored.");
  };

  const handleLogout = () => {
    window.localStorage.removeItem("linkerra-admin-profile");
    setProfile(null);
    setMessage("Signed out. Please re-enter your company credentials to continue.");
  };

  const updateReferral = (field: keyof typeof referral, value: string) => {
    setReferral((current) => ({ ...current, [field]: value }));
  };

  const saveReferral = (status: "draft" | "published") => {
    if (status === "published") {
      const required = ["jobTitle", "department", "employmentType", "workMode", "jobLocation", "referralLink", "applicationDeadline", "experienceRequired", "requiredSkills", "minimumQualification", "jobDescription"] as const;
      if (required.some((field) => !referral[field].trim())) {
        setMessage("Please complete all required referral details before publishing.");
        return;
      }
    }
    window.localStorage.setItem("linkerra-referral-draft", JSON.stringify(referral));
    setMessage(status === "draft" ? "Your referral has been saved as a draft." : "Referral published successfully. Candidates can now apply using your referral link.");
    if (status === "published") setView("requests");
  };

  const renderMainContent = () => {
    if (!profile) {
      return (
        <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
          <Card className="w-full max-w-2xl border-slate-200 shadow-sm">
            <CardBody className="p-8">
              <div className="flex items-center gap-2 text-indigo-700">
                <ShieldCheck size={18} />
                <p className="text-sm font-semibold uppercase tracking-[0.2em]">Admin workspace</p>
              </div>
              <h1 className="mt-4 text-3xl font-bold text-slate-900">Secure access for verified company employees</h1>
              <p className="mt-2 text-sm text-slate-600">
                Only people verified with a company email and employee ID can manage referral checks from this portal.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${mode === "signup" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}
                >
                  Create admin access
                </button>
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${mode === "login" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}
                >
                  Sign in
                </button>
              </div>

              <form onSubmit={mode === "signup" ? handleSubmit : handleLogin} className="mt-6 space-y-4">
                {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
                {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}

                {mode === "signup" ? (
                  <>
                    <Field label="Full name">
                      <Input placeholder="Aisha Khan" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                    </Field>
                    <Field label="Company name">
                      <Input placeholder="Microsoft" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} required />
                    </Field>
                    <Field label="Company email">
                      <Input type="email" placeholder="aisha@company.com" value={form.companyEmail} onChange={(event) => setForm({ ...form, companyEmail: event.target.value })} required />
                    </Field>
                    <Field label="Employee ID">
                      <Input placeholder="EMP-1042" value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })} required />
                    </Field>
                    <Field label="Password">
                      <Input type="password" placeholder="Create a secure password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Company email">
                      <Input type="email" placeholder="aisha@company.com" value={form.companyEmail} onChange={(event) => setForm({ ...form, companyEmail: event.target.value })} required />
                    </Field>
                    <Field label="Password">
                      <Input type="password" placeholder="Your admin password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
                    </Field>
                  </>
                )}

                <Button type="submit" className="w-full">
                  {mode === "signup" ? "Create access request" : "Sign in to portal"}
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      );
    }

    const currentPanel = {
      overview: (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-slate-200">
              <CardBody>
                <p className="text-sm text-slate-500">Pending reviews</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">24</p>
              </CardBody>
            </Card>
            <Card className="border-slate-200">
              <CardBody>
                <p className="text-sm text-slate-500">Verified employees</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">186</p>
              </CardBody>
            </Card>
            <Card className="border-slate-200">
              <CardBody>
                <p className="text-sm text-slate-500">Approval rate</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">92%</p>
              </CardBody>
            </Card>
          </div>
          <Card className="border-slate-200">
            <CardBody>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Latest verification queue</p>
                  <h2 className="text-lg font-semibold text-slate-900">New requests to inspect</h2>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">Live</span>
              </div>
              <div className="mt-4 space-y-3">
                {queueItems.map((item) => (
                  <div key={item.name} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-600">{item.company} • {item.email}</p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">{item.status}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      ),
      verification: (
        <Card className="border-slate-200">
          <CardBody>
            <div className="flex items-center gap-2 text-indigo-700">
              <BadgeCheck size={18} />
              <h2 className="text-lg font-semibold text-slate-900">Verification review</h2>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Aarav Mehta</p>
              <p className="mt-1 text-sm text-slate-600">Employee ID: EMP-1042 • Company email: aarav@company.com</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="primary" size="sm">Approve</Button>
                <Button variant="outline" size="sm">Request more info</Button>
              </div>
            </div>
          </CardBody>
        </Card>
      ),
      requests: (
        <Card className="border-slate-200">
          <CardBody>
            <div className="flex items-center gap-2 text-slate-700">
              <Users size={18} />
              <h2 className="text-lg font-semibold text-slate-900">Referral requests</h2>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="font-medium text-slate-900">Nina Patel — Google</p>
                <p className="mt-1 text-sm text-slate-600">Requested a Product Design referral • Status: Pending review</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="font-medium text-slate-900">Rahul Sharma — Stripe</p>
                <p className="mt-1 text-sm text-slate-600">Requested a Frontend referral • Status: Ready to contact</p>
              </div>
            </div>
          </CardBody>
        </Card>
      ),
      analytics: (
        <Card className="border-slate-200">
          <CardBody>
            <div className="flex items-center gap-2 text-violet-700">
              <Clock3 size={18} />
              <h2 className="text-lg font-semibold text-slate-900">Admin analytics</h2>
            </div>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Average response time is 3.8 hours. Verified employees are converting at a 31% success rate this quarter.
            </div>
          </CardBody>
        </Card>
      ),
      "provide-referral": (
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            saveReferral("published");
          }}
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Employee referral</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Provide a referral</h2>
            <p className="mt-1 text-sm text-slate-600">Share an open role with candidates. Fields marked * are required.</p>
          </div>

          <Card className="border-slate-200"><CardBody className="space-y-4">
            <div><h3 className="font-semibold text-slate-900">Employee information</h3><p className="text-sm text-slate-500">Auto-filled from your company profile</p></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Employee name"><Input value={profile.name} readOnly className="bg-slate-50" /></Field>
              <Field label="Company name"><Input value={profile.company} readOnly className="bg-slate-50" /></Field>
              <Field label="Department"><Input placeholder="e.g. Engineering" /></Field>
            </div>
          </CardBody></Card>

          <Card className="border-slate-200"><CardBody className="space-y-4">
            <h3 className="font-semibold text-slate-900">Job information</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Job title *"><Input required value={referral.jobTitle} onChange={(e) => updateReferral("jobTitle", e.target.value)} placeholder="e.g. Frontend Engineer" /></Field>
              <Field label="Job ID (optional)"><Input value={referral.jobId} onChange={(e) => updateReferral("jobId", e.target.value)} placeholder="e.g. ENG-104" /></Field>
              <Field label="Department *"><Input required value={referral.department} onChange={(e) => updateReferral("department", e.target.value)} placeholder="e.g. Engineering" /></Field>
              <Field label="Employment type *"><Select required value={referral.employmentType} onChange={(e) => updateReferral("employmentType", e.target.value)}><option value="">Select type</option><option>Full-time</option><option>Internship</option><option>Contract</option></Select></Field>
              <Field label="Work mode *"><Select required value={referral.workMode} onChange={(e) => updateReferral("workMode", e.target.value)}><option value="">Select mode</option><option>Remote</option><option>Hybrid</option><option>On-site</option></Select></Field>
              <Field label="Job location *"><Input required value={referral.jobLocation} onChange={(e) => updateReferral("jobLocation", e.target.value)} placeholder="City, country" /></Field>
            </div>
          </CardBody></Card>

          <Card className="border-slate-200"><CardBody className="space-y-4">
            <h3 className="font-semibold text-slate-900">Referral details</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Referral link *"><Input required type="url" value={referral.referralLink} onChange={(e) => updateReferral("referralLink", e.target.value)} placeholder="https://careers.company.com/..." /></Field>
              <Field label="Application deadline *"><Input required type="date" value={referral.applicationDeadline} onChange={(e) => updateReferral("applicationDeadline", e.target.value)} /></Field>
              <Field label="Number of openings (optional)"><Input type="number" min="1" value={referral.numberOfOpenings} onChange={(e) => updateReferral("numberOfOpenings", e.target.value)} /></Field>
              <Field label="Experience required *"><Input required value={referral.experienceRequired} onChange={(e) => updateReferral("experienceRequired", e.target.value)} placeholder="e.g. 2+ years" /></Field>
              <Field label="Required skills *"><Input required value={referral.requiredSkills} onChange={(e) => updateReferral("requiredSkills", e.target.value)} placeholder="React, TypeScript, CSS" /></Field>
              <Field label="Minimum qualification *"><Input required value={referral.minimumQualification} onChange={(e) => updateReferral("minimumQualification", e.target.value)} placeholder="Bachelor's degree or equivalent" /></Field>
              <Field label="Salary range (optional)"><Input value={referral.salaryRange} onChange={(e) => updateReferral("salaryRange", e.target.value)} placeholder="e.g. $80k–$100k" /></Field>
            </div>
            <Field label="Job description *"><Textarea required value={referral.jobDescription} onChange={(e) => updateReferral("jobDescription", e.target.value)} placeholder="Describe the role, responsibilities, and what makes this opportunity exciting." /></Field>
          </CardBody></Card>

          <Card className="border-slate-200"><CardBody className="space-y-4">
            <h3 className="font-semibold text-slate-900">Candidate instructions</h3>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Resume required"><Select value={referral.resumeRequired} onChange={(e) => updateReferral("resumeRequired", e.target.value)}><option>Yes</option><option>No</option></Select></Field><Field label="Preferred contact method"><Select value={referral.preferredContactMethod} onChange={(e) => updateReferral("preferredContactMethod", e.target.value)}><option>Email</option><option>Chat</option><option>Phone</option></Select></Field><Field label="Phone (optional)"><Input type="tel" value={referral.phone} onChange={(e) => updateReferral("phone", e.target.value)} placeholder="+1 555 000 0000" /></Field></div>
            <Field label="Additional instructions (optional)" hint="Example: Mention employee ID, preferred resume format, portfolio link, etc."><Textarea value={referral.additionalInstructions} onChange={(e) => updateReferral("additionalInstructions", e.target.value)} placeholder="Add any instructions for candidates." /></Field>
          </CardBody></Card>

          <div className="flex flex-wrap justify-end gap-3 pb-4"><Button type="button" variant="outline" onClick={() => saveReferral("draft")}>Save as draft</Button><Button type="submit"><PlusCircle size={16} /> Publish referral</Button></div>
        </form>
      ),
    }[view];

    return (
      <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
        <aside className="w-full border-b border-slate-200 bg-white p-4 lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white">
            <div className="rounded-xl bg-white/15 p-2">
              <Building2 size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">LinkErra Admin</p>
              <p className="text-xs text-slate-300">Company verification hub</p>
            </div>
          </div>

          <nav className="mt-6 space-y-2">
            <button
              type="button"
              onClick={() => { setView("provide-referral"); setMessage(null); }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <PlusCircle size={17} />
              Provide referral
            </button>
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${view === item.id ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-700">
              <Mail size={16} />
              <p className="text-sm font-semibold">Signed in as</p>
            </div>
            <p className="mt-2 font-medium text-slate-900">{profile.name}</p>
            <p className="text-sm text-slate-600">{profile.companyEmail}</p>
            <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 size={12} /> {profile.access === "granted" ? "Verified company access" : "Pending review"}
            </div>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Admin portal</p>
              <h1 className="text-2xl font-bold text-slate-900">{profile.company} operations center</h1>
            </div>
            <button type="button" onClick={handleLogout} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <LogOut size={16} /> Sign out
            </button>
          </div>
          {message ? <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div> : null}
          {currentPanel}
        </main>
      </div>
    );
  };

  return renderMainContent();
}
