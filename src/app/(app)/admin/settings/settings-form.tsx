"use client";

import { useI18n } from "@/lib/i18n/provider";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Radio } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { LiveBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Settings = {
  isLive: boolean;
  streamUrl: string;
  streamTitle: string;
  streamPlatform: string;
  loyaltyPerMatch: number;
  loyaltyPerVisit: number;
  loyaltyPerReservation: number;
};

export function SettingsForm({ settings }: { settings: Settings }) {
  const { tr } = useI18n();

  const router = useRouter();
  const [form, setForm] = useState(settings);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setLoading(true);
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isLive: form.isLive,
        streamUrl: form.streamUrl,
        streamTitle: form.streamTitle,
        streamPlatform: form.streamPlatform as "youtube" | "twitch",
        loyaltyPerMatch: Number(form.loyaltyPerMatch),
        loyaltyPerVisit: Number(form.loyaltyPerVisit),
        loyaltyPerReservation: Number(form.loyaltyPerReservation),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error(tr("Could not save settings"));
      return;
    }
    toast.success(tr("Settings saved"));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Live stream */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio size={18} className="text-live" /> {tr("Live broadcast")}
          </CardTitle>
          {form.isLive && <LiveBadge />}
        </CardHeader>
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => set("isLive", !form.isLive)}
            role="switch"
            aria-checked={form.isLive}
            className={cn(
              "flex w-full items-center justify-between rounded-xl border p-4 transition-colors",
              form.isLive ? "border-live/50 bg-live/5" : "border-border",
            )}
          >
            <span className="text-sm font-semibold">
              {form.isLive
                ? tr("Streaming is ON — LIVE badge shows across the site")
                : tr("Streaming is OFF")}
            </span>
            <span
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                form.isLive ? "bg-live" : "bg-surface-hover",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                  form.isLive ? "start-[22px]" : "start-0.5",
                )}
              />
            </span>
          </button>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="platform">{tr("Platform")}</Label>
              <Select
                id="platform"
                value={form.streamPlatform}
                onChange={(e) => set("streamPlatform", e.target.value)}
              >
                <option value="youtube">YouTube Live</option>
                <option value="twitch">Twitch</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="streamTitle">{tr("Stream title")}</Label>
              <Input
                id="streamTitle"
                value={form.streamTitle}
                onChange={(e) => set("streamTitle", e.target.value)}
                placeholder={tr("Championship Final Night")}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="streamUrl">{tr("Embed URL")}</Label>
            <Input
              id="streamUrl"
              type="url"
              value={form.streamUrl}
              onChange={(e) => set("streamUrl", e.target.value)}
              placeholder="https://www.youtube.com/embed/…"
            />
            <p className="mt-1.5 text-xs text-faint">
              {tr(
                "YouTube: use the /embed/VIDEO_ID URL. Twitch: https://player.twitch.tv/?channel=NAME&parent=yourdomain.com",
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* Loyalty rules */}
      <Card>
        <CardHeader>
          <CardTitle>{tr("Loyalty program rules")}</CardTitle>
        </CardHeader>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="perMatch">{tr("Points per match")}</Label>
            <Input
              id="perMatch"
              type="number"
              min={0}
              value={form.loyaltyPerMatch}
              onChange={(e) => set("loyaltyPerMatch", Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="perVisit">{tr("Points per visit")}</Label>
            <Input
              id="perVisit"
              type="number"
              min={0}
              value={form.loyaltyPerVisit}
              onChange={(e) => set("loyaltyPerVisit", Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="perReservation">
              {tr("Points per reservation")}
            </Label>
            <Input
              id="perReservation"
              type="number"
              min={0}
              value={form.loyaltyPerReservation}
              onChange={(e) =>
                set("loyaltyPerReservation", Number(e.target.value))
              }
            />
          </div>
        </div>
      </Card>

      <Button size="lg" onClick={save} disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {tr("Save settings")}
      </Button>
    </div>
  );
}
