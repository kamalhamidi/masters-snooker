"use client";

import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useEffect } from "react";
import { Lock } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export type WallBadge = {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  unlockedAt: string | null;
};

export function BadgeWall({
  badges,
  celebrate,
}: {
  badges: WallBadge[];
  celebrate?: boolean;
}) {
  useEffect(() => {
    if (!celebrate) return;
    const t = setTimeout(() => {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.4 },
        colors: ["#d4af37", "#10b981", "#f8f6f0"],
      });
    }, 400);
    return () => clearTimeout(t);
  }, [celebrate]);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {badges.map((b, i) => {
        const unlocked = !!b.unlockedAt;
        return (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04, type: "spring", stiffness: 260, damping: 22 }}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-2xl border p-5 text-center transition-all",
              unlocked
                ? "border-gold/40 bg-gold/5 hover:-translate-y-1 hover:shadow-lg hover:shadow-gold/10"
                : "border-border bg-surface opacity-60"
            )}
          >
            <div
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-full text-3xl",
                unlocked ? "bg-gold/15 ring-2 ring-gold/50" : "bg-surface-hover grayscale"
              )}
            >
              {unlocked ? b.icon : <Lock size={22} className="text-faint" />}
            </div>
            <p className={cn("font-semibold", unlocked && "text-gold-soft")}>{b.name}</p>
            <p className="text-xs text-muted">{b.description}</p>
            <p className="mt-auto text-[11px] text-faint">
              {unlocked ? `Unlocked ${formatDate(b.unlockedAt!)}` : `+${b.xpReward} XP`}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
