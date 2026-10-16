import { getI18n } from "@/lib/i18n/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Table2,
  Layers,
  ArrowLeft,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { StatCounter } from "@/components/ui/stat-counter";
import { formatCents } from "@/lib/utils";
import { TableManager } from "./table-manager";
import { TableTypeManager } from "./table-type-manager";

export async function generateMetadata(): Promise<Metadata> {
  const { tr } = await getI18n();
  return { title: tr("Billiard tables & types") };
}

export default async function AdminTablesPage() {
  const { tr, locale } = await getI18n();

  const session = await auth();
  if (session?.user.role !== "CHEF") redirect("/dashboard");

  // Fetch tables and table types
  // Note: if tableType model query is called, prisma will use the model
  const [tables, tableTypes] = await Promise.all([
    prisma.table.findMany({
      include: {
        type: true,
        _count: {
          select: {
            matches: true,
            reservations: true,
          },
        },
      },
      orderBy: { number: "asc" },
    }),
    prisma.tableType.findMany({
      include: {
        _count: {
          select: { tables: true },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const activeCount = tables.filter((t) => t.isActive).length;
  const avgHourlyRate =
    tables.length > 0
      ? Math.round(
          tables.reduce((acc, t) => acc + t.hourlyRate, 0) / tables.length,
        )
      : 0;

  return (
    <div className="space-y-8">
      {/* Header with back link */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft size={14} />
          {tr("Back to admin dashboard")}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl tracking-wide flex items-center gap-3">
              <Table2 className="text-emerald-bright" />
              {tr("Billiard tables & types")}
            </h1>
            <p className="text-sm text-muted">
              {tr("Manage the billiard tables and table disciplines of your club.")}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <Table2 className="mb-2 h-5 w-5 text-emerald-bright" />
          <p className="font-display text-3xl tracking-wide">
            <StatCounter value={tables.length} />
          </p>
          <p className="text-xs text-muted">{tr("Total tables")}</p>
        </Card>

        <Card>
          <CheckCircle2 className="mb-2 h-5 w-5 text-emerald-bright" />
          <p className="font-display text-3xl tracking-wide">
            <StatCounter value={activeCount} />
          </p>
          <p className="text-xs text-muted">{tr("Active & playable")}</p>
          <p className="mt-1 text-[11px] text-faint">
            {tables.length - activeCount} {tr("in maintenance")}
          </p>
        </Card>

        <Card>
          <Layers className="mb-2 h-5 w-5 text-gold" />
          <p className="font-display text-3xl tracking-wide">
            <StatCounter value={tableTypes.length} />
          </p>
          <p className="text-xs text-muted">{tr("Table disciplines / types")}</p>
        </Card>

        <Card>
          <DollarSign className="mb-2 h-5 w-5 text-gold" />
          <p className="font-display text-3xl tracking-wide">
            {formatCents(avgHourlyRate, locale)}
          </p>
          <p className="text-xs text-muted">{tr("Avg. hourly rate")}</p>
        </Card>
      </div>

      {/* Tables section */}
      <TableManager
        tables={tables.map((t) => ({
          id: t.id,
          number: t.number,
          name: t.name,
          hourlyRate: t.hourlyRate,
          isActive: t.isActive,
          typeId: t.typeId,
          type: t.type ? { id: t.type.id, name: t.type.name } : null,
          matchesCount: t._count.matches,
          reservationsCount: t._count.reservations,
        }))}
        types={tableTypes.map((tp) => ({
          id: tp.id,
          name: tp.name,
          description: tp.description,
          tableCount: tp._count.tables,
        }))}
      />

      {/* Table Types section */}
      <TableTypeManager
        types={tableTypes.map((tp) => ({
          id: tp.id,
          name: tp.name,
          description: tp.description,
          tableCount: tp._count.tables,
        }))}
      />
    </div>
  );
}
