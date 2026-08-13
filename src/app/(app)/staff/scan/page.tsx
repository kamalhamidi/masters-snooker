import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ScanInterface } from "./scan-interface";

export const metadata: Metadata = { title: "Check-in scanner" };

export default async function ScanPage() {
  const session = await auth();
  if (!session || (session.user.role !== "EMPLOYEE" && session.user.role !== "CHEF")) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <h1 className="font-display text-4xl tracking-wide">Check-in scanner</h1>
        <p className="mt-1 text-sm text-muted">
          Point the camera at a player&apos;s QR code, or paste their code manually.
          Each check-in awards visit loyalty points.
        </p>
      </div>
      <ScanInterface />
    </div>
  );
}
