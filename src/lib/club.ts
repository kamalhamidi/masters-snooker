import { prisma } from "@/lib/prisma";

export async function getClubSettings() {
  const settings = await prisma.clubSettings.findUnique({ where: { id: 1 } });
  return (
    settings ?? {
      id: 1,
      isLive: false,
      streamUrl: null,
      streamPlatform: "youtube",
      streamTitle: null,
      loyaltyPerMatch: 10,
      loyaltyPerVisit: 5,
      loyaltyPerReservation: 15,
    }
  );
}
