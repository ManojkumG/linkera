import {
  BadgeCheck,
  Brain,
  FileText,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";

import { Card, CardBody } from "~/app/_components/ui";

const STEPS = [
  {
    icon: <FileText size={22} />,
    title: "Build your profile",
    body: "Upload your resume — our AI extracts your skills, experience, and projects into a rich profile.",
  },
  {
    icon: <Search size={22} />,
    title: "Find verified referrers",
    body: "Search employees at your target companies by role, department, location, and availability.",
  },
  {
    icon: <Users size={22} />,
    title: "Request a referral",
    body: "Send a tailored request. The referrer reviews your profile and refers you internally.",
  },
  {
    icon: <TrendingUp size={22} />,
    title: "Track to hired",
    body: "Follow every request from Requested → Referred → Hired with real-time status updates.",
  },
];

const FEATURES = [
  {
    icon: <BadgeCheck size={20} />,
    title: "Verified employees",
    body: "Every referrer verifies with a company email, work OTP, or LinkedIn before they can list.",
  },
  {
    icon: <Brain size={20} />,
    title: "AI matching",
    body: "We rank referrals by skill alignment, experience, and location so you apply where you fit.",
  },
  {
    icon: <Sparkles size={20} />,
    title: "Resume tools",
    body: "ATS scoring, skill-gap analysis, and AI cover letters tuned to each opportunity.",
  },
  {
    icon: <ShieldCheck size={20} />,
    title: "Trust & reputation",
    body: "Ratings, response times, and referral success rates keep the marketplace honest.",
  },
];

export default function Home() {
  return (
    <div className="space-y-24 py-6">
      {/* Hero */}
      <section className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
          <Sparkles size={14} /> Referrals, not cold applications
        </span>
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Get referred by real employees at the companies you want.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          LinkErra connects job seekers directly with verified employees who
          are open to referring candidates — matched by AI, tracked end-to-end.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700"
          >
            Find a referral
          </Link>
          <Link
            href="/signup?role=employee"
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Become a referrer
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-center text-2xl font-bold text-slate-900">
          How it works
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Card key={s.title}>
              <CardBody>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  {s.icon}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-600">
                    0{i + 1}
                  </span>
                  <h3 className="font-semibold text-slate-900">{s.title}</h3>
                </div>
                <p className="mt-2 text-sm text-slate-600">{s.body}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="text-center text-2xl font-bold text-slate-900">
          Built for trust and speed
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <CardBody className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{f.body}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-linear-to-br from-indigo-600 to-violet-600 px-8 py-14 text-center text-white">
        <h2 className="text-3xl font-bold">Your next role is one referral away.</h2>
        <p className="mx-auto mt-3 max-w-xl text-indigo-100">
          Join LinkErra and turn a warm introduction into an interview.
        </p>
        <Link
          href="/signup"
          className="mt-7 inline-block rounded-lg bg-white px-6 py-3 font-medium text-indigo-700 hover:bg-indigo-50"
        >
          Create your free account
        </Link>
      </section>
    </div>
  );
}
