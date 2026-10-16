import { PrismaClient, MatchType, LoyaltyTier } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  computePointsExchange,
  computeXp,
  levelForXp,
  tierForLoyaltyPoints,
} from "../src/lib/points";
import { BADGE_DEFS } from "../src/lib/badges";

const prisma = new PrismaClient();

const PASSWORD = "password123";

const PLAYER_NAMES = [
  "Ronnie Osman", "Karim El Masry", "Youssef Hamdi", "Omar Farouk",
  "Tarek Nour", "Hassan Aly", "Mahmoud Salem", "Adam Kassem",
  "Ziad Mansour", "Selim Rashad", "Nour Ehab", "Laila Sherif",
  "Farida Zaki", "Mostafa Gad",
];

function daysAgo(n: number, hour = 18, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function daysFromNow(n: number, hour = 18): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  console.log("Clearing existing data…");
  // Delete in dependency order
  await prisma.$transaction([
    prisma.rating.deleteMany(),
    prisma.pointsHistory.deleteMany(),
    prisma.rewardRedemption.deleteMany(),
    prisma.loyaltyTransaction.deleteMany(),
    prisma.checkIn.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.playerBadge.deleteMany(),
    prisma.match.deleteMany(),
    prisma.tournamentEntry.deleteMany(),
    prisma.tournament.deleteMany(),
    prisma.reservation.deleteMany(),
    prisma.reward.deleteMany(),
    prisma.badge.deleteMany(),
    prisma.player.deleteMany(),
    prisma.employee.deleteMany(),
    prisma.user.deleteMany(),
    prisma.table.deleteMany(),
    prisma.tableType.deleteMany(),
    prisma.clubSettings.deleteMany(),
  ]);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  console.log("Creating badges, rewards, table types, tables, settings…");
  await prisma.badge.createMany({ data: BADGE_DEFS.map((b) => ({ ...b })) });
  const badges = await prisma.badge.findMany();
  const badgeByCode = Object.fromEntries(badges.map((b) => [b.code, b]));

  await prisma.reward.createMany({
    data: [
      { name: "1 Hour Free Table Time", description: "Redeem for a free hour on any standard table", cost: 200, icon: "clock" },
      { name: "20% Off Next Reservation", description: "Discount voucher for your next booking", cost: 120, icon: "percent" },
      { name: "Club T-Shirt", description: "Official Master's Snooker merch tee", cost: 350, icon: "shirt" },
      { name: "Pro Cue Rental (Free Day)", description: "Use a professional cue free for one day", cost: 150, icon: "wand" },
      { name: "VIP Table Upgrade", description: "Upgrade any booking to the VIP table", cost: 300, icon: "crown" },
      { name: "Free Coaching Session", description: "30-minute session with a club coach", cost: 500, icon: "graduation-cap" },
    ],
  });
  const rewards = await prisma.reward.findMany();

  const [snookerType, poolType, englishType, caromType] = await Promise.all([
    prisma.tableType.create({
      data: {
        name: "Snooker 12ft",
        description: "Championship full-size 12ft snooker table with precision wool cloth and steel cushions.",
      },
    }),
    prisma.tableType.create({
      data: {
        name: "American Pool 9ft",
        description: "Professional 9ft tournament pool table with fast Simonis cloth and drop pockets.",
      },
    }),
    prisma.tableType.create({
      data: {
        name: "English Pool 7ft",
        description: "Standard 7ft English 8-ball table with napped cloth and 2-inch balls.",
      },
    }),
    prisma.tableType.create({
      data: {
        name: "Carom / 3-Cushion",
        description: "Pocketless heated carom billiard table for three-cushion championships.",
      },
    }),
  ]);

  const tables = await Promise.all(
    [1, 2, 3, 4, 5, 6].map((n) =>
      prisma.table.create({
        data: {
          number: n,
          name: n === 6 ? "VIP Championship Table" : `Table ${n}`,
          hourlyRate: n === 6 ? 3000 : 1500,
          typeId: n === 3 || n === 4 ? poolType.id : snookerType.id,
        },
      })
    )
  );

  await prisma.clubSettings.create({
    data: {
      id: 1,
      isLive: true,
      streamUrl: "https://www.youtube.com/embed/Oz9F04PJZFc",
      streamPlatform: "youtube",
      streamTitle: "Club Championship — Semi-Final Night",
    },
  });

  console.log("Creating users…");
  const chefUser = await prisma.user.create({
    data: {
      email: "chef@masters.club",
      name: "Kamal Masters",
      passwordHash,
      role: "CHEF",
      employee: { create: { position: "Club Owner" } },
      player: {
        create: {
          trustBadge: true,
          bio: "Club owner — still plays a mean safety game.",
          points: 1180,
          xp: 850,
          level: 3,
        },
      },
    },
    include: { employee: true, player: true },
  });

  const employeeUsers = await Promise.all(
    [
      { email: "sara@masters.club", name: "Sara Adel", position: "Floor Manager" },
      { email: "omar@masters.club", name: "Omar Sayed", position: "Match Referee" },
    ].map((e) =>
      prisma.user.create({
        data: {
          email: e.email,
          name: e.name,
          passwordHash,
          role: "EMPLOYEE",
          employee: { create: { position: e.position } },
          player: { create: { bio: "Club staff & player.", points: 1020, xp: 320, level: 2 } },
        },
        include: { employee: true, player: true },
      })
    )
  );
  const employees = [chefUser.employee!, ...employeeUsers.map((u) => u.employee!)];

  const playerUsers = await Promise.all(
    PLAYER_NAMES.map((name, i) =>
      prisma.user.create({
        data: {
          email: `${name.split(" ")[0].toLowerCase()}@demo.club`,
          name,
          passwordHash,
          role: "PLAYER",
          player: {
            create: {
              trustBadge: i < 6, // first 6 players are trusted
              bio: i === 0 ? "Club veteran. Highest break: 147 (in my dreams)." : undefined,
            },
          },
        },
        include: { player: true },
      })
    )
  );
  const players = playerUsers.map((u) => u.player!);

  // Track in-memory state so ratings evolve realistically
  const state = new Map(
    players.map((p) => [p.id, { points: 1000, xp: 0, wins: 0, played: 0, loyaltyEarned: 0, loyalty: 0 }])
  );

  console.log("Simulating 90 days of match history…");
  const matchTypes: MatchType[] = ["FRIENDLY", "RANKED", "RANKED", "RANKED", "TOURNAMENT"];
  let matchCount = 0;

  for (let day = 90; day >= 1; day -= 1) {
    const matchesToday = 1 + (day % 3); // 1-3 matches per day
    for (let m = 0; m < matchesToday; m++) {
      const i1 = Math.floor(Math.random() * players.length);
      let i2 = Math.floor(Math.random() * players.length);
      if (i2 === i1) i2 = (i2 + 1) % players.length;
      const p1 = players[i1];
      const p2 = players[i2];
      const s1 = state.get(p1.id)!;
      const s2 = state.get(p2.id)!;

      const type = matchTypes[Math.floor(Math.random() * matchTypes.length)];
      // Stronger player more likely to win
      const p1WinProb = 1 / (1 + Math.pow(10, (s2.points - s1.points) / 400));
      const p1Wins = Math.random() < p1WinProb;
      const winner = p1Wins ? p1 : p2;
      const loser = p1Wins ? p2 : p1;
      const sw = state.get(winner.id)!;
      const sl = state.get(loser.id)!;

      const frames = 3;
      const winScore = 2;
      const loseScore = Math.floor(Math.random() * 2);

      const { winnerDelta, loserDelta } = computePointsExchange(sw.points, sl.points, type);
      const wLevel = levelForXp(sw.xp);
      const lLevel = levelForXp(sl.xp);
      const xpW = computeXp(true, wLevel, lLevel, type);
      const xpL = computeXp(false, lLevel, wLevel, type);

      const completedAt = daysAgo(day, 14 + (m * 3) % 9, (m * 17) % 60);
      const employee = employees[matchCount % employees.length];

      const match = await prisma.match.create({
        data: {
          type,
          status: "COMPLETED",
          player1Id: p1.id,
          player2Id: p2.id,
          winnerId: winner.id,
          score1: p1Wins ? winScore : loseScore,
          score2: p1Wins ? loseScore : winScore,
          frames,
          tableId: tables[matchCount % tables.length].id,
          managedById: employee.id,
          scheduledAt: completedAt,
          completedAt,
        },
      });

      sw.points += winnerDelta;
      sl.points += loserDelta;
      sw.xp += xpW;
      sl.xp += xpL;
      sw.wins += 1;
      sw.played += 1;
      sl.played += 1;
      sw.loyaltyEarned += 10; sw.loyalty += 10;
      sl.loyaltyEarned += 10; sl.loyalty += 10;

      if (type !== "FRIENDLY") {
        await prisma.pointsHistory.createMany({
          data: [
            { playerId: winner.id, matchId: match.id, delta: winnerDelta, newTotal: sw.points, xpDelta: xpW, reason: `Won ${type.toLowerCase()} match`, createdAt: completedAt },
            { playerId: loser.id, matchId: match.id, delta: loserDelta, newTotal: sl.points, xpDelta: xpL, reason: `Lost ${type.toLowerCase()} match`, createdAt: completedAt },
          ],
        });
      }
      matchCount++;
    }
  }
  console.log(`Created ${matchCount} matches.`);

  console.log("Applying final player states…");
  for (const p of players) {
    const s = state.get(p.id)!;
    await prisma.player.update({
      where: { id: p.id },
      data: {
        points: s.points,
        xp: s.xp,
        level: levelForXp(s.xp),
        loyaltyPoints: s.loyalty,
        loyaltyTier: tierForLoyaltyPoints(s.loyaltyEarned) as LoyaltyTier,
      },
    });
    // Loyalty transactions summary entries
    await prisma.loyaltyTransaction.createMany({
      data: [
        { playerId: p.id, type: "EARN", delta: s.loyaltyEarned, reason: "Match play points (season total)", createdAt: daysAgo(5) },
      ],
    });
    // Check-ins
    const visits = 3 + Math.floor(Math.random() * 25);
    await prisma.checkIn.createMany({
      data: Array.from({ length: visits }, (_, i) => ({
        playerId: p.id,
        createdAt: daysAgo(Math.floor(Math.random() * 90)),
        byEmployeeId: employees[i % employees.length].id,
      })),
    });
  }

  console.log("Awarding earned badges…");
  for (const p of players) {
    const s = state.get(p.id)!;
    const checkIns = await prisma.checkIn.count({ where: { playerId: p.id } });
    const codes: string[] = [];
    if (s.wins >= 1) codes.push("first_victory");
    if (s.wins >= 10) codes.push("wins_10");
    if (s.wins >= 50) codes.push("wins_50");
    if (s.played >= 100) codes.push("matches_100");
    if (checkIns >= 20) codes.push("regular");
    if (codes.length) {
      await prisma.playerBadge.createMany({
        data: codes.map((c) => ({ playerId: p.id, badgeId: badgeByCode[c].id, unlockedAt: daysAgo(Math.floor(Math.random() * 30)) })),
        skipDuplicates: true,
      });
    }
  }

  console.log("Creating tournaments…");
  // Completed past tournament with a winner
  const ranked = [...players].sort(
    (a, b) => state.get(b.id)!.points - state.get(a.id)!.points
  );
  const pastWinner = ranked[0];

  const pastTournament = await prisma.tournament.create({
    data: {
      name: "Spring Masters Cup",
      slug: "spring-masters-cup",
      description: "Our flagship spring knockout — 16 players, one champion.",
      format: "KNOCKOUT",
      status: "COMPLETED",
      maxPlayers: 16,
      entryFee: 2500,
      prizePool: 50000,
      startDate: daysAgo(45),
      endDate: daysAgo(40),
      winnerId: pastWinner.id,
      rules: "Best of 5 frames until the final (best of 9). Standard WPBSA rules.",
    },
  });
  await prisma.tournamentEntry.createMany({
    data: ranked.slice(0, 12).map((p) => ({
      tournamentId: pastTournament.id,
      playerId: p.id,
      status: "APPROVED" as const,
      paymentStatus: "PAID" as const,
    })),
  });
  await prisma.playerBadge.createMany({
    data: [{ playerId: pastWinner.id, badgeId: badgeByCode["champion"].id, unlockedAt: daysAgo(40) }],
    skipDuplicates: true,
  });
  // Final match of past tournament
  await prisma.match.create({
    data: {
      type: "TOURNAMENT",
      status: "COMPLETED",
      player1Id: ranked[0].id,
      player2Id: ranked[1].id,
      winnerId: pastWinner.id,
      score1: 5,
      score2: 3,
      frames: 9,
      tableId: tables[5].id,
      managedById: employees[0].id,
      tournamentId: pastTournament.id,
      round: "Final",
      scheduledAt: daysAgo(40, 20),
      completedAt: daysAgo(40, 22),
    },
  });

  // Open tournament accepting registrations
  const openTournament = await prisma.tournament.create({
    data: {
      name: "Summer Break Open",
      slug: "summer-break-open",
      description: "Open knockout for all levels. Great prizes, great vibes — bring your A-game.",
      format: "KNOCKOUT",
      status: "REGISTRATION",
      maxPlayers: 32,
      entryFee: 2000,
      prizePool: 60000,
      startDate: daysFromNow(10),
      rules: "Best of 3 frames until semi-finals (best of 5). Dress code: smart casual.",
    },
  });
  await prisma.tournamentEntry.createMany({
    data: [
      { tournamentId: openTournament.id, playerId: ranked[2].id, status: "APPROVED" as const, paymentStatus: "PAID" as const },
      { tournamentId: openTournament.id, playerId: ranked[4].id, status: "APPROVED" as const, paymentStatus: "PAID" as const },
      { tournamentId: openTournament.id, playerId: ranked[8].id, status: "PENDING" as const, paymentStatus: "PAID" as const },
      { tournamentId: openTournament.id, playerId: ranked[10].id, status: "PENDING" as const, paymentStatus: "UNPAID" as const },
    ],
  });

  // Championship in progress
  const championship = await prisma.tournament.create({
    data: {
      name: "Master's Club Championship 2026",
      slug: "club-championship-2026",
      description: "The official club championship. Highest ranking weight of the year — champions are made here.",
      format: "GROUPS_KNOCKOUT",
      status: "IN_PROGRESS",
      isChampionship: true,
      maxPlayers: 16,
      entryFee: 5000,
      prizePool: 150000,
      startDate: daysAgo(3),
      endDate: daysFromNow(4),
      rules: "Groups of 4, top 2 advance to knockout. Best of 7 frames. Referee mandatory.",
    },
  });
  await prisma.tournamentEntry.createMany({
    data: ranked.slice(0, 8).map((p) => ({
      tournamentId: championship.id,
      playerId: p.id,
      status: "APPROVED" as const,
      paymentStatus: "PAID" as const,
    })),
  });
  // A live championship match happening right now
  await prisma.match.create({
    data: {
      type: "CHAMPIONSHIP",
      status: "LIVE",
      player1Id: ranked[0].id,
      player2Id: ranked[3].id,
      score1: 2,
      score2: 2,
      frames: 7,
      tableId: tables[5].id,
      managedById: employees[1].id,
      tournamentId: championship.id,
      round: "Semi-final",
      scheduledAt: new Date(),
    },
  });
  // Upcoming scheduled matches
  await prisma.match.createMany({
    data: [
      {
        type: "CHAMPIONSHIP", status: "SCHEDULED",
        player1Id: ranked[1].id, player2Id: ranked[2].id,
        frames: 7, tableId: tables[5].id, managedById: employees[2].id,
        tournamentId: championship.id, round: "Semi-final",
        scheduledAt: daysFromNow(1, 19),
      },
      {
        type: "RANKED", status: "SCHEDULED",
        player1Id: ranked[5].id, player2Id: ranked[6].id,
        frames: 5, tableId: tables[2].id, managedById: employees[1].id,
        scheduledAt: daysFromNow(1, 17),
      },
    ],
  });

  console.log("Creating reservations…");
  const resData = [];
  for (let d = 0; d < 5; d++) {
    for (let r = 0; r < 4; r++) {
      const player = players[(d * 4 + r) % players.length];
      const table = tables[(d + r) % tables.length];
      const start = daysFromNow(d, 15 + r * 2);
      const end = new Date(start.getTime() + 2 * 3600 * 1000);
      resData.push({
        playerId: player.id,
        tableId: table.id,
        startTime: start,
        endTime: end,
        status: (r % 3 === 0 ? "PENDING" : "CONFIRMED") as "PENDING" | "CONFIRMED",
        managedById: r % 3 === 0 ? null : employees[r % employees.length].id,
      });
    }
  }
  await prisma.reservation.createMany({ data: resData });

  console.log("Creating ratings & notifications…");
  const someMatches = await prisma.match.findMany({
    where: { status: "COMPLETED" },
    take: 30,
    orderBy: { completedAt: "desc" },
  });
  for (const m of someMatches.slice(0, 15)) {
    await prisma.rating.create({
      data: {
        matchId: m.id,
        playerId: m.player1Id,
        employeeId: m.managedById,
        serviceStars: 4 + Math.round(Math.random()),
        tableStars: 3 + Math.round(Math.random() * 2),
        overallStars: 4 + Math.round(Math.random()),
        comment: Math.random() > 0.5 ? "Great atmosphere, table played true." : null,
        createdAt: m.completedAt ?? new Date(),
      },
    });
  }

  // Notifications for the demo player (Ronnie)
  const demoUser = playerUsers[0];
  await prisma.notification.createMany({
    data: [
      { userId: demoUser.id, type: "TOURNAMENT_UPDATE", title: "Championship semi-final tonight", body: "Your semi-final vs a top-4 seed starts at 7 PM on the VIP table.", link: "/tournaments/club-championship-2026" },
      { userId: demoUser.id, type: "BADGE_EARNED", title: "Badge unlocked: Ten Wins", body: "🎯 Win 10 matches (+200 XP)", link: "/achievements" },
      { userId: demoUser.id, type: "RESERVATION_CONFIRMED", title: "Reservation confirmed", body: "Table 3 — tomorrow 5:00 PM to 7:00 PM.", link: "/reservations" },
      { userId: demoUser.id, type: "RATING_REQUEST", title: "How was your last match?", body: "Rate the table, service and overall experience from your ranked match.", link: "/matches" },
      { userId: demoUser.id, type: "LOYALTY_REWARD", title: "Reward within reach", body: "You're 40 points away from a free table hour.", link: "/loyalty" },
    ],
  });

  // Loyalty redemption example
  await prisma.rewardRedemption.create({
    data: { playerId: players[0].id, rewardId: rewards[1].id, createdAt: daysAgo(12) },
  });
  await prisma.loyaltyTransaction.create({
    data: { playerId: players[0].id, type: "REDEEM", delta: -rewards[1].cost, reason: `Redeemed: ${rewards[1].name}`, createdAt: daysAgo(12) },
  });
  await prisma.player.update({
    where: { id: players[0].id },
    data: { loyaltyPoints: { decrement: rewards[1].cost } },
  });

  console.log("\nSeed complete!");
  console.log("──────────────────────────────────────────");
  console.log("Demo accounts (password for all: password123)");
  console.log("  Chef (owner):  chef@masters.club");
  console.log("  Employee:      sara@masters.club");
  console.log("  Player:        ronnie@demo.club");
  console.log("──────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
