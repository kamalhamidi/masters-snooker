import type { Metadata } from "next";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { CheckCircle2, Download } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "My QR code" };

export default async function CheckinPage() {
  const session = await auth();
  if (!session?.user.playerId) redirect("/login");

  const player = await prisma.player.findUniqueOrThrow({
    where: { id: session.user.playerId },
    include: { user: { select: { name: true } } },
  });

  const lastCheckIn = await prisma.checkIn.findFirst({
    where: { playerId: player.id },
    orderBy: { createdAt: "desc" },
  });

  const payload = `masters-checkin:${player.qrToken}`;
  const qrDataUrl = await QRCode.toDataURL(payload, {
    width: 480,
    margin: 2,
    color: { dark: "#0b3d2e", light: "#f8f6f0" },
  });

  const checkedInToday =
    lastCheckIn &&
    new Date(lastCheckIn.createdAt).toDateString() === new Date().toDateString();

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h1 className="font-display text-4xl tracking-wide">My check-in QR</h1>
        <p className="mt-1 text-sm text-muted">
          Show this at the club kiosk or to any staff member. Checking in marks
          your attendance and unlocks reservations & match creation.
        </p>
      </div>

      <Card glass className="flex flex-col items-center gap-4 p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt={`Check-in QR code for ${player.user.name}`}
          className="w-full max-w-[280px] rounded-2xl border-4 border-gold/40 shadow-lg"
        />
        <p className="font-display text-2xl tracking-wide">{player.user.name}</p>
        {checkedInToday ? (
          <Badge variant="emerald" className="px-3 py-1.5">
            <CheckCircle2 size={14} /> Checked in today
          </Badge>
        ) : (
          <Badge className="px-3 py-1.5">Not checked in today</Badge>
        )}
        {lastCheckIn && (
          <p className="text-xs text-faint">
            Last visit: {formatDateTime(lastCheckIn.createdAt)}
          </p>
        )}
        <a
          href={qrDataUrl}
          download={`masters-snooker-qr-${player.user.name.replace(/\s+/g, "-").toLowerCase()}.png`}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-bright"
        >
          <Download size={16} /> Download QR
        </a>
      </Card>

      <p className="text-center text-xs text-faint">
        Your QR is personal — each scan earns loyalty points for your visit.
      </p>
    </div>
  );
}
