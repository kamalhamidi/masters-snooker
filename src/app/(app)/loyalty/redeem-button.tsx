"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RedeemButton({
  rewardId,
  affordable,
}: {
  rewardId: string;
  affordable: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function redeem() {
    setLoading(true);
    const res = await fetch("/api/loyalty/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewardId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Redemption failed");
      return;
    }
    confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 }, colors: ["#d4af37", "#10b981"] });
    toast.success("Redeemed! Show the front desk your notification to claim.");
    router.refresh();
  }

  return (
    <Button
      variant={affordable ? "gold" : "secondary"}
      size="sm"
      className="w-full"
      disabled={!affordable || loading}
      onClick={redeem}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {affordable ? "Redeem" : "Not enough points"}
    </Button>
  );
}
