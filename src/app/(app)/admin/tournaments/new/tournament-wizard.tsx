"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Crown, Loader2, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STEPS = ["Basics", "Format & money", "Schedule & rules"];

export function TournamentWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    isChampionship: false,
    format: "KNOCKOUT",
    maxPlayers: 16,
    entryFee: 20,
    prizePool: 500,
    startDate: "",
    endDate: "",
    rules: "",
    bannerUrl: "",
    openRegistration: true,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function validateStep(): string | null {
    if (step === 0) {
      if (form.name.trim().length < 3) return "Give the tournament a name (3+ chars)";
      if (form.description.trim().length < 10) return "Add a short description (10+ chars)";
    }
    if (step === 2 && !form.startDate) return "Pick a start date";
    return null;
  }

  function next() {
    const err = validateStep();
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function submit() {
    const err = validateStep();
    if (err) {
      toast.error(err);
      return;
    }
    setLoading(true);
    const res = await fetch("/api/admin/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        description: form.description.trim(),
        format: form.format,
        isChampionship: form.isChampionship,
        maxPlayers: Number(form.maxPlayers),
        entryFee: Math.round(Number(form.entryFee) * 100),
        prizePool: Math.round(Number(form.prizePool) * 100),
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        rules: form.rules.trim() || undefined,
        bannerUrl: form.bannerUrl.trim(),
        openRegistration: form.openRegistration,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not create tournament");
      return;
    }
    toast.success("Tournament created — players notified!");
    router.push(`/tournaments/${data.slug}`);
    router.refresh();
  }

  return (
    <Card className="overflow-hidden">
      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
                i === step
                  ? "bg-emerald-accent text-white"
                  : i < step
                    ? "bg-emerald-accent/20 text-emerald-bright cursor-pointer"
                    : "bg-surface-hover text-faint"
              )}
            >
              {i + 1}
            </button>
            <span
              className={cn(
                "hidden text-xs font-medium sm:block",
                i === step ? "text-foreground" : "text-faint"
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22 }}
          className="space-y-4"
        >
          {step === 0 && (
            <>
              <div>
                <Label htmlFor="name">Tournament name</Label>
                <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Autumn Masters Cup" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What makes this event special?" />
              </div>
              <div>
                <Label htmlFor="bannerUrl">Banner image URL <span className="text-faint">(optional)</span></Label>
                <Input id="bannerUrl" type="url" value={form.bannerUrl} onChange={(e) => set("bannerUrl", e.target.value)} placeholder="https://…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => set("isChampionship", false)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-4 transition-colors",
                    !form.isChampionship ? "border-emerald-accent bg-emerald-accent/10" : "border-border"
                  )}
                >
                  <Trophy size={20} className="text-emerald-bright" />
                  <span className="text-sm font-semibold">Tournament</span>
                  <span className="text-xs text-muted">Standard weight</span>
                </button>
                <button
                  type="button"
                  onClick={() => set("isChampionship", true)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-4 transition-colors",
                    form.isChampionship ? "border-gold bg-gold/10" : "border-border"
                  )}
                >
                  <Crown size={20} className="text-gold" />
                  <span className="text-sm font-semibold">Championship</span>
                  <span className="text-xs text-muted">Highest ranking weight</span>
                </button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="format">Format</Label>
                  <Select id="format" value={form.format} onChange={(e) => set("format", e.target.value)}>
                    <option value="KNOCKOUT">Knockout</option>
                    <option value="ROUND_ROBIN">Round robin</option>
                    <option value="GROUPS_KNOCKOUT">Groups + knockout</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="maxPlayers">Number of players</Label>
                  <Select id="maxPlayers" value={form.maxPlayers} onChange={(e) => set("maxPlayers", Number(e.target.value))}>
                    {[8, 16, 32, 64].map((n) => (
                      <option key={n} value={n}>{n} players</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="entryFee">Entry fee ($)</Label>
                  <Input id="entryFee" type="number" min={0} value={form.entryFee} onChange={(e) => set("entryFee", Number(e.target.value))} />
                </div>
                <div>
                  <Label htmlFor="prizePool">Prize pool ($)</Label>
                  <Input id="prizePool" type="number" min={0} value={form.prizePool} onChange={(e) => set("prizePool", Number(e.target.value))} />
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-4">
                <input
                  type="checkbox"
                  checked={form.openRegistration}
                  onChange={(e) => set("openRegistration", e.target.checked)}
                  className="h-5 w-5 accent-emerald-500"
                />
                <span>
                  <span className="block text-sm font-semibold">Open registration immediately</span>
                  <span className="block text-xs text-muted">All players get a notification. Untick to save as draft.</span>
                </span>
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="startDate">Start date</Label>
                  <Input id="startDate" type="datetime-local" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="endDate">End date <span className="text-faint">(optional)</span></Label>
                  <Input id="endDate" type="datetime-local" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
                </div>
              </div>
              <div>
                <Label htmlFor="rules">Rules</Label>
                <Textarea id="rules" rows={5} value={form.rules} onChange={(e) => set("rules", e.target.value)} placeholder={"Best of 5 frames until semi-finals.\nWPBSA rules. Dress code: smart casual."} />
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ArrowLeft size={16} /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next}>
            Next <ArrowRight size={16} />
          </Button>
        ) : (
          <Button variant="gold" onClick={submit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create tournament
          </Button>
        )}
      </div>
    </Card>
  );
}
