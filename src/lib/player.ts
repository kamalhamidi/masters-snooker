import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

/** Every staff member can also play — auto-provision a Player row if missing. */
export async function ensurePlayerProfile(userId: string, role?: Role) {
  const existing = await prisma.player.findUnique({ where: { userId } });
  if (existing) return existing;

  return prisma.player.create({
    data: {
      userId,
      // Club owner and long-serving staff get trusted status by default
      trustBadge: role === "CHEF",
      bio:
        role === "CHEF"
          ? "Club owner — still plays a mean safety game."
          : role === "EMPLOYEE"
            ? "Club staff & player."
            : undefined,
    },
  });
}

export function isStaffRole(role: Role) {
  return role === "EMPLOYEE" || role === "CHEF";
}
