"use client";

import { Briefcase, User } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Alert, Button, Card, CardBody, Field, Input } from "~/app/_components/ui";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState<"seeker" | "employee">(
    params.get("role") === "employee" ? "employee" : "seeker",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const signup = api.auth.signup.useMutation({
    onSuccess: async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Account created, but sign-in failed. Try logging in.");
        return;
      }
      router.push("/onboarding");
      router.refresh();
    },
    onError: (e) => setError(e.message),
  });

  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="text-center text-2xl font-bold text-slate-900">
        Create your account
      </h1>
      <p className="mt-1 text-center text-sm text-slate-500">
        Start getting referred, or start referring.
      </p>

      <Card className="mt-6">
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <RoleTile
              active={role === "seeker"}
              onClick={() => setRole("seeker")}
              icon={<User size={18} />}
              title="Job seeker"
              subtitle="I want referrals"
            />
            <RoleTile
              active={role === "employee"}
              onClick={() => setRole("employee")}
              icon={<Briefcase size={18} />}
              title="Referrer"
              subtitle="I can refer people"
            />
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              signup.mutate({ name, email, password, role });
            }}
          >
            <Field label="Full name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                required
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </Field>
            <Field label="Password" hint="At least 8 characters.">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
              />
            </Field>
            <Button
              type="submit"
              className="w-full"
              disabled={signup.isPending}
            >
              {signup.isPending ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </CardBody>
      </Card>

      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          Log in
        </Link>
      </p>
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
        "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
        active
          ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
          : "border-slate-200 hover:border-slate-300",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md",
          active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600",
        )}
      >
        {icon}
      </span>
      <span className="text-sm font-semibold text-slate-900">{title}</span>
      <span className="text-xs text-slate-500">{subtitle}</span>
    </button>
  );
}
