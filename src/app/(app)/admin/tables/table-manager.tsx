"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Table2,
  Search,
  CheckCircle2,
  XCircle,
  Swords,
  CalendarClock,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label, Select } from "@/components/ui/input";
import { formatCents, cn } from "@/lib/utils";
import type { TableTypeItem } from "./table-type-manager";

export type AdminTableItem = {
  id: string;
  number: number;
  name: string;
  hourlyRate: number; // in cents
  isActive: boolean;
  typeId: string | null;
  type: {
    id: string;
    name: string;
  } | null;
  matchesCount: number;
  reservationsCount: number;
};

export function TableManager({
  tables,
  types,
}: {
  tables: AdminTableItem[];
  types: TableTypeItem[];
}) {
  const { tr, locale } = useI18n();
  const router = useRouter();

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<AdminTableItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Form states
  const nextSuggestedNumber =
    tables.length > 0 ? Math.max(...tables.map((t) => t.number)) + 1 : 1;
  const [number, setNumber] = useState(nextSuggestedNumber);
  const [name, setName] = useState("");
  const [hourlyRateAmount, setHourlyRateAmount] = useState("15.00");
  const [typeId, setTypeId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  function openAddModal() {
    const nextNum =
      tables.length > 0 ? Math.max(...tables.map((t) => t.number)) + 1 : 1;
    setNumber(nextNum);
    setName(`Table ${nextNum}`);
    setHourlyRateAmount("15.00");
    setTypeId(types.length > 0 ? types[0].id : "");
    setIsActive(true);
    setAddOpen(true);
  }

  function openEditModal(table: AdminTableItem) {
    setEditItem(table);
    setNumber(table.number);
    setName(table.name);
    setHourlyRateAmount((table.hourlyRate / 100).toFixed(2));
    setTypeId(table.typeId ?? "");
    setIsActive(table.isActive);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const rateInCents = Math.round(parseFloat(hourlyRateAmount || "0") * 100);

    try {
      const res = await fetch("/api/admin/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: Number(number),
          name: name.trim(),
          hourlyRate: rateInCents,
          typeId: typeId || null,
          isActive,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(tr(data.error ?? "Failed to add table"));
        return;
      }

      toast.success(tr("Table {number} added successfully", { number }));
      setAddOpen(false);
      router.refresh();
    } catch {
      toast.error(tr("Network error. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editItem) return;
    setLoading(true);

    const rateInCents = Math.round(parseFloat(hourlyRateAmount || "0") * 100);

    try {
      const res = await fetch("/api/admin/tables", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editItem.id,
          number: Number(number),
          name: name.trim(),
          hourlyRate: rateInCents,
          typeId: typeId || null,
          isActive,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(tr(data.error ?? "Failed to update table"));
        return;
      }

      toast.success(tr("Table updated"));
      setEditItem(null);
      router.refresh();
    } catch {
      toast.error(tr("Network error. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(table: AdminTableItem) {
    setTogglingId(table.id);
    const newStatus = !table.isActive;

    try {
      const res = await fetch("/api/admin/tables", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: table.id,
          isActive: newStatus,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(tr(data.error ?? "Failed to update status"));
        return;
      }

      toast.success(
        newStatus
          ? tr("Table is now active and available for booking")
          : tr("Table marked as inactive (maintenance)"),
      );
      router.refresh();
    } catch {
      toast.error(tr("Network error. Please try again."));
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(table: AdminTableItem) {
    if (!window.confirm(tr("Delete {name}? This cannot be undone.", { name: table.name }))) {
      return;
    }

    try {
      const res = await fetch("/api/admin/tables", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: table.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(tr(data.error ?? "Failed to delete table"));
        return;
      }

      toast.success(tr("Table deleted"));
      router.refresh();
    } catch {
      toast.error(tr("Network error. Please try again."));
    }
  }

  // Filtering
  const filtered = tables.filter((t) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = t.name.toLowerCase().includes(q);
      const matchNum = String(t.number).includes(q);
      const matchType = t.type?.name.toLowerCase().includes(q);
      if (!matchName && !matchNum && !matchType) return false;
    }
    if (typeFilter !== "ALL") {
      if (typeFilter === "UNCATEGORIZED" && t.typeId !== null) return false;
      if (typeFilter !== "UNCATEGORIZED" && t.typeId !== typeFilter) return false;
    }
    if (statusFilter === "ACTIVE" && !t.isActive) return false;
    if (statusFilter === "INACTIVE" && t.isActive) return false;
    return true;
  });

  return (
    <section className="space-y-4">
      <CardHeader className="mb-0 flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Table2 className="text-emerald-bright" size={22} />
            {tr("Club billiard tables")}
          </CardTitle>
          <p className="mt-1 text-xs text-muted">
            {tr("Add, configure, and monitor your club's snooker & pool tables.")}
          </p>
        </div>
        <Button size="sm" onClick={openAddModal}>
          <Plus size={16} /> {tr("Add table")}
        </Button>
      </CardHeader>

      {/* Filter and search bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr("Search by table name, number, or type...")}
            className="pl-9 h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 text-xs w-auto min-w-[140px]"
          >
            <option value="ALL">{tr("All disciplines / types")}</option>
            {types.map((tp) => (
              <option key={tp.id} value={tp.id}>
                {tp.name}
              </option>
            ))}
            <option value="UNCATEGORIZED">{tr("Uncategorized")}</option>
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 text-xs w-auto min-w-[120px]"
          >
            <option value="ALL">{tr("All statuses")}</option>
            <option value="ACTIVE">{tr("Active only")}</option>
            <option value="INACTIVE">{tr("Inactive / Maintenance")}</option>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-10 text-center">
          <Table2 className="mb-3 text-faint" size={36} />
          <p className="font-semibold">{tr("No tables match your filter")}</p>
          <p className="mt-1 text-xs text-muted max-w-sm">
            {tables.length === 0
              ? tr("Your billiard club currently has no tables configured. Add your first table now!")
              : tr("Try adjusting your search query or filters.")}
          </p>
          {tables.length === 0 && (
            <Button size="sm" className="mt-4" onClick={openAddModal}>
              <Plus size={15} /> {tr("Add first table")}
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const isToggling = togglingId === t.id;

            return (
              <Card
                key={t.id}
                className={cn(
                  "group relative flex flex-col justify-between border-border transition-all",
                  t.isActive
                    ? "hover:border-emerald-accent/50"
                    : "border-border/60 bg-surface/50 opacity-80",
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-accent/15 font-display text-sm font-semibold text-emerald-bright">
                        {t.number}
                      </span>
                      <h3 className="font-semibold text-foreground text-base truncate">
                        {t.name}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleStatus(t)}
                      disabled={isToggling}
                      title={t.isActive ? tr("Click to deactivate") : tr("Click to activate")}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer",
                        t.isActive
                          ? "bg-emerald-accent/15 text-emerald-bright hover:bg-emerald-accent/25"
                          : "bg-surface-hover text-muted hover:bg-surface-hover/80",
                      )}
                    >
                      {isToggling ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : t.isActive ? (
                        <CheckCircle2 size={11} />
                      ) : (
                        <XCircle size={11} />
                      )}
                      {t.isActive ? tr("Active") : tr("Maintenance")}
                    </button>
                  </div>

                  {/* Type badge and rate */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {t.type ? (
                      <Badge variant="emerald" className="text-xs">
                        {t.type.name}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs text-muted">
                        {tr("General / No type")}
                      </Badge>
                    )}

                    <span className="font-display text-sm font-semibold text-gold">
                      {formatCents(t.hourlyRate, locale)}
                      <span className="text-[11px] font-normal text-muted">
                        {tr("/hr")}
                      </span>
                    </span>
                  </div>

                  {/* Activity counters */}
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Swords size={13} className="text-faint" />
                      {t.matchesCount} {tr("matches")}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarClock size={13} className="text-faint" />
                      {t.reservationsCount} {tr("bookings")}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-1.5 border-t border-border pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(t)}
                    className="h-8 px-2.5 text-xs text-muted hover:text-foreground"
                  >
                    <Pencil size={13} className="me-1" />
                    {tr("Edit")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(t)}
                    className="h-8 px-2.5 text-xs text-muted hover:text-live"
                    aria-label={tr("Delete {name}", { name: t.name })}
                  >
                    <Trash2 size={13} className="me-1" />
                    {tr("Delete")}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Table Dialog */}
      <Dialog
        open={addOpen}
        onClose={() => !loading && setAddOpen(false)}
        title={tr("Add billiard table")}
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tbl-num">{tr("Table number")}</Label>
              <Input
                id="tbl-num"
                type="number"
                min={1}
                value={number}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setNumber(val);
                  if (!name || name.startsWith("Table ")) {
                    setName(`Table ${val}`);
                  }
                }}
                required
              />
            </div>
            <div>
              <Label htmlFor="tbl-rate">{tr("Hourly rate")}</Label>
              <div className="relative">
                <Input
                  id="tbl-rate"
                  type="number"
                  step="0.50"
                  min="0"
                  value={hourlyRateAmount}
                  onChange={(e) => setHourlyRateAmount(e.target.value)}
                  placeholder="15.00"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="tbl-name">{tr("Table name / Label")}</Label>
            <Input
              id="tbl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tr("e.g. Table 1 - Star Championship")}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label htmlFor="tbl-type" className="mb-0">
                {tr("Table type / discipline")}
              </Label>
              {types.length === 0 && (
                <span className="text-xs text-gold flex items-center gap-1">
                  <Sparkles size={11} /> {tr("Add types above")}
                </span>
              )}
            </div>
            <Select
              id="tbl-type"
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
            >
              <option value="">{tr("— General / Uncategorized —")}</option>
              {types.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {tp.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="tbl-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-border text-emerald-accent focus:ring-emerald-accent/20"
            />
            <Label htmlFor="tbl-active" className="mb-0 text-foreground cursor-pointer">
              {tr("Available for play & reservations")}
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setAddOpen(false)}
              disabled={loading}
            >
              {tr("Cancel")}
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {tr("Add table")}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Table Dialog */}
      <Dialog
        open={!!editItem}
        onClose={() => !loading && setEditItem(null)}
        title={tr("Edit billiard table")}
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tbl-edit-num">{tr("Table number")}</Label>
              <Input
                id="tbl-edit-num"
                type="number"
                min={1}
                value={number}
                onChange={(e) => setNumber(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <Label htmlFor="tbl-edit-rate">{tr("Hourly rate")}</Label>
              <Input
                id="tbl-edit-rate"
                type="number"
                step="0.50"
                min="0"
                value={hourlyRateAmount}
                onChange={(e) => setHourlyRateAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tbl-edit-name">{tr("Table name / Label")}</Label>
            <Input
              id="tbl-edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="tbl-edit-type">{tr("Table type / discipline")}</Label>
            <Select
              id="tbl-edit-type"
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
            >
              <option value="">{tr("— General / Uncategorized —")}</option>
              {types.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {tp.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="tbl-edit-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-border text-emerald-accent focus:ring-emerald-accent/20"
            />
            <Label htmlFor="tbl-edit-active" className="mb-0 text-foreground cursor-pointer">
              {tr("Available for play & reservations")}
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditItem(null)}
              disabled={loading}
            >
              {tr("Cancel")}
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {tr("Save changes")}
            </Button>
          </div>
        </form>
      </Dialog>
    </section>
  );
}
