import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getClubSettings } from "@/lib/club";
import { SettingsForm } from "./settings-form";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  return { title: tr("Club settings") };
}

export default async function AdminSettingsPage() {
  const { tr } = await getI18n();

  const session = await auth();
  if (session?.user.role !== "CHEF") redirect("/dashboard");

  const settings = await getClubSettings();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-wide">
          {tr("Club settings")}
        </h1>
        <p className="text-sm text-muted">
          {tr("Live broadcast controls and loyalty program rules.")}
        </p>
      </div>
      <SettingsForm
        settings={{
          isLive: settings.isLive,
          streamUrl: settings.streamUrl ?? "",
          streamTitle: settings.streamTitle ?? "",
          streamPlatform: settings.streamPlatform,
          loyaltyPerMatch: settings.loyaltyPerMatch,
          loyaltyPerVisit: settings.loyaltyPerVisit,
          loyaltyPerReservation: settings.loyaltyPerReservation,
        }}
      />
    </div>
  );
}
