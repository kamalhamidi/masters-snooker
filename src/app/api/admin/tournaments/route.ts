import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(600),
  format: z.enum(["KNOCKOUT", "ROUND_ROBIN", "GROUPS_KNOCKOUT"]),
  isChampionship: z.boolean().default(false),
  maxPlayers: z.number().int().min(4).max(128),
  entryFee: z.number().int().min(0).max(1_000_000), // cents
  prizePool: z.number().int().min(0).max(100_000_000), // cents
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  rules: z.string().max(2000).optional(),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  openRegistration: z.boolean().default(true),
});

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "CHEF") {
    return NextResponse.json({ error: "Chef only" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const d = parsed.data;

  let slug = slugify(d.name);
  const clash = await prisma.tournament.findUnique({ where: { slug } });
  if (clash) slug = `${slug}-${Date.now().toString(36)}`;

  const tournament = await prisma.tournament.create({
    data: {
      name: d.name,
      slug,
      description: d.description,
      format: d.format,
      isChampionship: d.isChampionship,
      maxPlayers: d.maxPlayers,
      entryFee: d.entryFee,
      prizePool: d.prizePool,
      startDate: new Date(d.startDate),
      endDate: d.endDate ? new Date(d.endDate) : null,
      rules: d.rules,
      bannerUrl: d.bannerUrl || null,
      status: d.openRegistration ? "REGISTRATION" : "DRAFT",
    },
  });

  // Announce to all players
  if (d.openRegistration) {
    const players = await prisma.user.findMany({
      where: { role: "PLAYER" },
      select: { id: true },
    });
    await prisma.notification.createMany({
      data: players.map((p) => ({
        userId: p.id,
        type: "TOURNAMENT_UPDATE" as const,
        title: `New tournament: ${tournament.name}`,
        body: `Registration is open — ${d.maxPlayers} spots. Entry ${d.entryFee ? `$${(d.entryFee / 100).toFixed(0)}` : "free"}.`,
        link: `/tournaments/${tournament.slug}`,
      })),
    });
  }

  return NextResponse.json({ ok: true, slug: tournament.slug }, { status: 201 });
}
