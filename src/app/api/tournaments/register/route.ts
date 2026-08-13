import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const schema = z.object({ tournamentId: z.string() });

/**
 * Tournament registration.
 * - Trusted players (club-issued trust badge) are auto-approved once paid.
 * - Others enter as PENDING and are reviewed by the Chef.
 * - Payment: real Stripe Checkout when STRIPE_SECRET_KEY is set, otherwise
 *   an instant demo payment so the flow is fully testable locally.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user.playerId) {
    return NextResponse.json({ error: "Players only" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const [tournament, player] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id: parsed.data.tournamentId },
      include: { _count: { select: { entries: true } } },
    }),
    prisma.player.findUniqueOrThrow({ where: { id: session.user.playerId } }),
  ]);

  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }
  if (tournament.status !== "REGISTRATION") {
    return NextResponse.json({ error: "Registration is closed" }, { status: 400 });
  }
  if (tournament._count.entries >= tournament.maxPlayers) {
    return NextResponse.json({ error: "Tournament is full" }, { status: 400 });
  }

  const existing = await prisma.tournamentEntry.findUnique({
    where: {
      tournamentId_playerId: {
        tournamentId: tournament.id,
        playerId: player.id,
      },
    },
  });
  if (existing && existing.status !== "WITHDRAWN") {
    return NextResponse.json({ error: "Already registered" }, { status: 409 });
  }

  // Stripe checkout path (production)
  if (tournament.entryFee > 0 && process.env.STRIPE_SECRET_KEY) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Entry fee — ${tournament.name}` },
            unit_amount: tournament.entryFee,
          },
          quantity: 1,
        },
      ],
      metadata: { tournamentId: tournament.id, playerId: player.id },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/tournaments/${tournament.slug}?paid=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/tournaments/${tournament.slug}`,
    });
    // Entry recorded as UNPAID until webhook confirms; kept simple here.
    await prisma.tournamentEntry.upsert({
      where: { tournamentId_playerId: { tournamentId: tournament.id, playerId: player.id } },
      create: { tournamentId: tournament.id, playerId: player.id, status: "PENDING", paymentStatus: "UNPAID" },
      update: { status: "PENDING", paymentStatus: "UNPAID" },
    });
    return NextResponse.json({ ok: true, checkoutUrl: checkout.url });
  }

  // Demo payment path (no Stripe keys configured)
  const autoApproved = player.trustBadge;
  const entry = await prisma.tournamentEntry.upsert({
    where: { tournamentId_playerId: { tournamentId: tournament.id, playerId: player.id } },
    create: {
      tournamentId: tournament.id,
      playerId: player.id,
      status: autoApproved ? "APPROVED" : "PENDING",
      paymentStatus: tournament.entryFee > 0 ? "PAID" : "UNPAID",
    },
    update: {
      status: autoApproved ? "APPROVED" : "PENDING",
      paymentStatus: tournament.entryFee > 0 ? "PAID" : "UNPAID",
    },
  });

  await prisma.notification.create({
    data: {
      userId: session.user.id,
      type: autoApproved ? "TOURNAMENT_ACCEPTED" : "TOURNAMENT_UPDATE",
      title: autoApproved
        ? `You're in: ${tournament.name}`
        : `Application received: ${tournament.name}`,
      body: autoApproved
        ? "Your trust badge fast-tracked your entry. Good luck!"
        : "Your application is pending staff approval. We'll notify you once reviewed.",
      link: `/tournaments/${tournament.slug}`,
    },
  });

  return NextResponse.json({ ok: true, entry });
}
