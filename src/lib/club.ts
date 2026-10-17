import { prisma } from "@/lib/prisma";

export async function getClubSettings() {
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

  try {
    const settings = await prisma.clubSettings.findUnique({ where: { id: 1 } });
    return settings ?? fallback;
  } catch (error) {
    console.error("[getClubSettings] Error loading club settings:", error);
    return fallback;
  }
}
