import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ScanInterface } from "./scan-interface";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  return { title: tr("Check-in scanner") };
}

export default async function ScanPage() {
  const { tr } = await getI18n();

  const session = await auth();
  if (
    !session ||
    (session.user.role !== "EMPLOYEE" && session.user.role !== "CHEF")
  ) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h1 className="font-display text-4xl tracking-wide">
          {tr("Check-in scanner")}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {tr(
            "Point the camera at a player's QR code, or paste their code manually. Each check-in awards visit loyalty points.",
          )}
        </p>
      </div>
      <ScanInterface />
    </div>
  );
}
