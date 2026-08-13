"use client";

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
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (entryStatus === "APPROVED") {
    return (
      <p className="flex items-center gap-2 font-semibold text-emerald-bright">
        <CheckCircle2 size={18} /> You&apos;re confirmed — see you at the table.
      </p>
    );
  }
  if (entryStatus === "PENDING") {
    return (
      <p className="flex items-center gap-2 font-semibold text-gold-soft">
        <Clock size={18} /> Application submitted — awaiting staff approval.
      </p>
    );
  }
  if (entryStatus === "REJECTED") {
    return (
      <p className="flex items-center gap-2 font-semibold text-live">
        <XCircle size={18} /> Your application wasn&apos;t accepted this time.
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
      toast.error(data.error ?? "Registration failed");
      return;
    }
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }
    if (trustBadge) {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 }, colors: ["#d4af37", "#10b981"] });
      toast.success("You're in! Trust badge fast-tracked your entry.");
    } else {
      toast.success("Application submitted — staff will review it shortly.");
    }
    router.refresh();
  }

  return (
    <Button size="lg" variant="gold" onClick={register} disabled={loading} className="w-full sm:w-auto">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket size={17} />}
      Register {entryFee > 0 && `· pay ${formatCents(entryFee)}`}
    </Button>
  );
}
