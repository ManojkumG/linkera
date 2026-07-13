"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

import {
  Button,
  Card,
  EmptyState,
  Spinner,
} from "~/app/_components/ui";
import { cn, timeAgo } from "~/lib/utils";
import { api } from "~/trpc/react";

export function NotificationsList() {
  const utils = api.useUtils();
  const list = api.notification.list.useQuery({ limit: 50 });
  const markAll = api.notification.markAllRead.useMutation({
    onSuccess: () => {
      void utils.notification.list.invalidate();
      void utils.notification.unreadCount.invalidate();
    },
  });
  const markRead = api.notification.markRead.useMutation({
    onSuccess: () => {
      void utils.notification.list.invalidate();
      void utils.notification.unreadCount.invalidate();
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        {list.data && list.data.some((n) => !n.isRead) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
          >
            Mark all read
          </Button>
        )}
      </div>

      <div className="mt-5">
        {list.isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="text-indigo-600" />
          </div>
        ) : list.data && list.data.length > 0 ? (
          <Card>
            <ul className="divide-y divide-slate-100">
              {list.data.map((n) => {
                const body = (
                  <div
                    className={cn(
                      "flex gap-3 px-5 py-4",
                      !n.isRead && "bg-indigo-50/50",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        n.isRead ? "bg-transparent" : "bg-indigo-500",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{n.title}</p>
                      {n.body && (
                        <p className="text-sm text-slate-600">{n.body}</p>
                      )}
                      <p className="mt-0.5 text-xs text-slate-400">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link
                        href={n.link}
                        onClick={() =>
                          !n.isRead && markRead.mutate({ id: n.id })
                        }
                        className="block hover:bg-slate-50"
                      >
                        {body}
                      </Link>
                    ) : (
                      <button
                        className="block w-full text-left hover:bg-slate-50"
                        onClick={() =>
                          !n.isRead && markRead.mutate({ id: n.id })
                        }
                      >
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        ) : (
          <EmptyState
            icon={<Bell size={28} />}
            title="No notifications"
            description="Updates about your referral requests will appear here."
          />
        )}
      </div>
    </div>
  );
}
