import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TournamentWizard } from "./tournament-wizard";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  return { title: tr("New tournament") };
}

export default async function NewTournamentPage() {
  const { tr } = await getI18n();

  const session = await auth();
  if (session?.user.role !== "CHEF") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-4xl tracking-wide">
          {tr("Create a tournament")}
        </h1>
        <p className="text-sm text-muted">
          {tr(
            "Three quick steps — basics, format & money, schedule & rules. Players get notified the moment registration opens.",
          )}
        </p>
      </div>
      <TournamentWizard />
    </div>
  );
}
