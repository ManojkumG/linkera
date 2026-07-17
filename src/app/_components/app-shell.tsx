"use client";

import { usePathname } from "next/navigation";

import { Navbar } from "~/app/_components/navbar";
import { Providers } from "~/app/_components/providers";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <Providers>
      {!isAdminRoute ? <Navbar /> : null}
      <main className={isAdminRoute ? "min-h-screen" : "mx-auto max-w-6xl px-4 py-8"}>
        {children}
      </main>
    </Providers>
  );
}
