"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trophy, Medal, CalendarClock, Star, Gift, Bell, Swords, CheckCheck,
} from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { NotificationType } from "@prisma/client";

const ICONS: Partial<Record<NotificationType, typeof Bell>> = {
  MATCH_ASSIGNED: Swords,
  MATCH_RESULT: Swords,
  TOURNAMENT_UPDATE: Trophy,
  TOURNAMENT_ACCEPTED: Trophy,
  TOURNAMENT_REJECTED: Trophy,
  BADGE_EARNED: Medal,
  RESERVATION_CONFIRMED: CalendarClock,
  RESERVATION_REMINDER: CalendarClock,
  RATING_REQUEST: Star,
  LOYALTY_REWARD: Gift,
};

type Item = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationList({ notifications }: { notifications: Item[] }) {
  const router = useRouter();

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    router.refresh();
  }

  async function markOne(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    router.refresh();
  }

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="space-y-3">
      {hasUnread && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={markAll}>
            <CheckCheck size={15} /> Mark all read
          </Button>
        </div>
      )}
      {notifications.map((n) => {
        const Icon = ICONS[n.type] ?? Bell;
        const inner = (
          <div
            className={cn(
              "flex gap-3.5 rounded-2xl border p-4 transition-colors",
              n.read
                ? "border-border bg-surface"
                : "border-emerald-accent/30 bg-emerald-accent/5 hover:bg-emerald-accent/10"
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                n.read ? "bg-surface-hover text-faint" : "bg-emerald-accent/15 text-emerald-bright"
              )}
            >
              <Icon size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className={cn("font-semibold", !n.read && "text-foreground")}>{n.title}</p>
                <span className="shrink-0 text-xs text-faint">{timeAgo(n.createdAt)}</span>
              </div>
              <p className="mt-0.5 text-sm text-muted">{n.body}</p>
            </div>
            {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-bright" />}
          </div>
        );

        return n.link ? (
          <Link key={n.id} href={n.link} onClick={() => markOne(n.id)} className="block">
            {inner}
          </Link>
        ) : (
          <button key={n.id} onClick={() => markOne(n.id)} className="block w-full text-left">
            {inner}
          </button>
        );
      })}
    </div>
  );
}
