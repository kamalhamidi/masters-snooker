/**
 * End-to-end smoke test of core business logic, run in-process with Prisma
 * (dev-only helper; does not print secrets).
 *
 * Usage: npx tsx scripts/smoke-test.ts
 */
import { PrismaClient } from "@prisma/client";
import { computePointsExchange, computeXp, levelForXp } from "../src/lib/points";

const prisma = new PrismaClient();

let failures = 0;
function check(name: string, cond: boolean, extra = "") {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`);
  if (!cond) failures++;
}

async function main() {
  // 1. Points formula sanity
  const even = computePointsExchange(1000, 1000, "RANKED");
  check("Elo: even match exchanges K/2", even.winnerDelta === 12, `got ${even.winnerDelta}`);
  const upset = computePointsExchange(900, 1200, "RANKED");
  const expected = computePointsExchange(1200, 900, "RANKED");
  check(
    "Elo: upset pays more than expected win",
    upset.winnerDelta > expected.winnerDelta,
    `upset +${upset.winnerDelta} vs expected +${expected.winnerDelta}`
  );
  const friendly = computePointsExchange(1000, 1200, "FRIENDLY");
  check("Elo: friendly exchanges nothing", friendly.winnerDelta === 0);
  const champ = computePointsExchange(1000, 1000, "CHAMPIONSHIP");
  check("Elo: championship > ranked weight", champ.winnerDelta > even.winnerDelta);
  check("XP: upset bonus applies", computeXp(true, 2, 5, "RANKED") > computeXp(true, 5, 2, "RANKED"));
  check("Level curve monotonic", levelForXp(0) === 1 && levelForXp(150) === 2 && levelForXp(600) === 3);

  // 2. Simulated match completion side effects (direct DB, mirrors API logic)
  const players = await prisma.player.findMany({
    take: 2,
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });
  const [a, b] = players;
  const table = await prisma.table.findFirstOrThrow();
  const employee = await prisma.employee.findFirstOrThrow();

  const match = await prisma.match.create({
    data: {
      player1Id: a.id,
      player2Id: b.id,
      type: "RANKED",
      status: "SCHEDULED",
      tableId: table.id,
      managedById: employee.id,
      frames: 3,
    },
  });
  check("Match created", !!match.id);

  const { winnerDelta, loserDelta } = computePointsExchange(a.points, b.points, "RANKED");
  await prisma.$transaction([
    prisma.match.update({
      where: { id: match.id },
      data: { status: "COMPLETED", score1: 2, score2: 0, winnerId: a.id, completedAt: new Date() },
    }),
    prisma.player.update({ where: { id: a.id }, data: { points: { increment: winnerDelta } } }),
    prisma.player.update({ where: { id: b.id }, data: { points: { increment: loserDelta } } }),
  ]);
  const aAfter = await prisma.player.findUniqueOrThrow({ where: { id: a.id } });
  check("Winner points increased", aAfter.points === a.points + winnerDelta);

  // Clean up test artifacts
  await prisma.match.delete({ where: { id: match.id } });
  await prisma.player.update({ where: { id: a.id }, data: { points: a.points } });
  await prisma.player.update({ where: { id: b.id }, data: { points: b.points } });

  // 3. Reservation conflict detection query shape
  const res = await prisma.reservation.findFirst({ where: { status: "PENDING" } });
  if (res) {
    const conflict = await prisma.reservation.findFirst({
      where: {
        tableId: res.tableId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startTime: { lt: res.endTime },
        endTime: { gt: res.startTime },
        id: { not: res.id },
      },
    });
    check("Overlap query executes (self-exclusion works)", conflict?.id !== res.id);
  }

  // 4. Data integrity from seed
  const [badges, rewards, settings, playersCount] = await Promise.all([
    prisma.badge.count(),
    prisma.reward.count(),
    prisma.clubSettings.findUnique({ where: { id: 1 } }),
    prisma.player.count(),
  ]);
  check("Badges seeded", badges === 10, `${badges}`);
  check("Rewards seeded", rewards === 6, `${rewards}`);
  check("Club settings exist + live demo stream", !!settings?.isLive);
  check("Players seeded", playersCount >= 14, `${playersCount}`);

  console.log(failures === 0 ? "\nAll smoke tests passed." : `\n${failures} failures.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().finally(() => prisma.$disconnect());
