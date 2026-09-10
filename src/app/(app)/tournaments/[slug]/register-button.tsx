"use client";

import { useI18n } from "@/lib/i18n/provider";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Loader2, Ticket, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/utils";
import type { EntryStatus } from "@prisma/client";

export function RegisterButton({
  tournamentId,
  entryStatus,
  trustBadge,
  entryFee,
}: {
  tournamentId: string;
  slug: string;
  entryStatus: EntryStatus | null;
  trustBadge: boolean;
  entryFee: number;
}) {
  const { tr, locale } = useI18n();

  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (entryStatus === "APPROVED") {
    return (
      <p className="flex items-center gap-2 font-semibold text-emerald-bright">
        <CheckCircle2 size={18} />{" "}
        {tr("You're confirmed — see you at the table.")}
      </p>
    );
  }
  if (entryStatus === "PENDING") {
    return (
      <p className="flex items-center gap-2 font-semibold text-gold-soft">
        <Clock size={18} />{" "}
        {tr("Application submitted — awaiting staff approval.")}
      </p>
    );
  }
  if (entryStatus === "REJECTED") {
    return (
      <p className="flex items-center gap-2 font-semibold text-live">
        <XCircle size={18} />{" "}
        {tr("Your application wasn't accepted this time.")}
      </p>
    );
  }

  async function register() {
    setLoading(true);
    const res = await fetch("/api/tournaments/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tournamentId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      toast.error(tr(data.error ?? tr("Registration failed")));
      return;
    }
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }
    if (trustBadge) {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.5 },
        colors: ["#d4af37", "#10b981"],
      });
      toast.success("You're in! Trust badge fast-tracked your entry.");
    } else {
      toast.success(
        tr("Application submitted — staff will review it shortly."),
      );
    }
    router.refresh();
  }

  return (
    <Button
      size="lg"
      variant="gold"
      onClick={register}
      disabled={loading}
      className="w-full sm:w-auto"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Ticket size={17} />
      )}
      {tr("Register")}{" "}
      {entryFee > 0 &&
        tr("· pay {amount}", { amount: formatCents(entryFee, locale) })}
    </Button>
  );
}
