"use client";

import {
  Bell,
  Briefcase,
  LayoutDashboard,
  LogOut,
  Search,
  Send,
  User,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, Badge } from "~/app/_components/ui";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

function NavLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-indigo-50 text-indigo-700"
          : "text-slate-600 hover:bg-slate-100",
      )}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role;

  const unread = api.notification.unreadCount.useQuery(undefined, {
    enabled: status === "authenticated",
    refetchInterval: 30_000,
  });

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Briefcase size={18} />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            SharkHire
          </span>
        </Link>

        {status === "authenticated" ? (
          <>
            <nav className="flex items-center gap-1">
              <NavLink
                href="/dashboard"
                icon={<LayoutDashboard size={18} />}
                label="Dashboard"
                active={pathname === "/dashboard"}
              />
              <NavLink
                href="/referrals"
                icon={<Search size={18} />}
                label="Find referrals"
                active={pathname.startsWith("/referrals")}
              />
              {role === "employee" ? (
                <NavLink
                  href="/listings"
                  icon={<Briefcase size={18} />}
                  label="My listings"
                  active={pathname.startsWith("/listings")}
                />
              ) : null}
              <NavLink
                href="/requests"
                icon={<Send size={18} />}
                label="Requests"
                active={pathname.startsWith("/requests")}
              />
            </nav>

            <div className="flex items-center gap-1">
              <Link
                href="/notifications"
                className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unread.data ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unread.data > 9 ? "9+" : unread.data}
                  </span>
                ) : null}
              </Link>
              <Link
                href="/profile"
                className="rounded-lg p-1.5 hover:bg-slate-100"
                aria-label="Profile"
              >
                <Avatar
                  name={session.user?.name}
                  src={session.user?.image}
                  size={32}
                />
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </>
        ) : (
          <nav className="flex items-center gap-2">
            <Link
              href="/referrals"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:block"
            >
              Browse referrals
            </Link>
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Get started
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

/** Small role indicator used on the dashboard header. */
export function RolePill({ role }: { role?: string }) {
  if (role === "employee")
    return (
      <Badge color="indigo">
        <User size={12} /> Referrer
      </Badge>
    );
  return (
    <Badge color="blue">
      <User size={12} /> Job seeker
    </Badge>
  );
}
