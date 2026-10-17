import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const fallback = {
  id: 1,
  isLive: false,
  streamUrl: null,
  streamPlatform: "youtube",
  streamTitle: null,
  loyaltyPerMatch: 10,
  loyaltyPerVisit: 5,
  loyaltyPerReservation: 15,
};

export const getClubSettings = unstable_cache(
  async () => {
    try {
      const settings = await prisma.clubSettings.findUnique({ where: { id: 1 } });
      return settings ?? fallback;
    } catch (error) {
      console.error("[getClubSettings] Error loading club settings:", error);
      return fallback;
    }
  },
  ["club-settings"],
  { revalidate: 300, tags: ["club-settings"] }
);
