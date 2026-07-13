"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { Alert, Button, Card, CardBody, Field, Input } from "~/app/_components/ui";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(params.get("next") ?? "/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="text-center text-2xl font-bold text-slate-900">
        Welcome back
      </h1>
      <p className="mt-1 text-center text-sm text-slate-500">
        Log in to manage your referrals.
      </p>

      <Card className="mt-6">
        <CardBody>
          <form className="space-y-4" onSubmit={onSubmit}>
            {error && <Alert variant="error">{error}</Alert>}
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </Field>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Log in"}
            </Button>
          </form>
        </CardBody>
      </Card>

      <p className="mt-4 text-center text-sm text-slate-500">
        New to SharkHire?{" "}
        <Link href="/signup" className="font-medium text-indigo-600 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
