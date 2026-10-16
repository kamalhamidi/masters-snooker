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
  Layers,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Textarea, Label } from "@/components/ui/input";

export type TableTypeItem = {
  id: string;
  name: string;
  description: string | null;
  tableCount: number;
};

const TYPE_PRESETS = [
  {
    name: "Snooker 12ft",
    description: "Championship full-size 12ft snooker table with precision wool cloth and steel cushions.",
  },
  {
    name: "American Pool 9ft",
    description: "Professional 9ft tournament pool table with fast Simonis cloth and drop pockets.",
  },
  {
    name: "English Pool 7ft",
    description: "Standard 7ft English 8-ball table with napped cloth and 2-inch balls.",
  },
  {
    name: "Carom / 3-Cushion",
    description: "Pocketless heated carom billiard table for three-cushion championships.",
  },
  {
    name: "Russian Pyramid 12ft",
    description: "Full-size 12ft pyramid table with tight pocket margins and oversized white balls.",
  },
];

export function TableTypeManager({ types }: { types: TableTypeItem[] }) {
  const { tr } = useI18n();
  const router = useRouter();

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<TableTypeItem | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function openAddModal() {
    setName("");
    setDescription("");
    setAddOpen(true);
  }

  function openEditModal(item: TableTypeItem) {
    setEditItem(item);
    setName(item.name);
    setDescription(item.description ?? "");
  }

  function applyPreset(preset: { name: string; description: string }) {
    setName(preset.name);
    setDescription(preset.description);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/table-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(tr(data.error ?? "Failed to create table type"));
        return;
      }

      toast.success(tr("Table type created successfully"));
      setAddOpen(false);
      setName("");
      setDescription("");
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

    try {
      const res = await fetch("/api/admin/table-types", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editItem.id, name, description }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(tr(data.error ?? "Failed to update table type"));
        return;
      }

      toast.success(tr("Table type updated"));
      setEditItem(null);
      router.refresh();
    } catch {
      toast.error(tr("Network error. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(item: TableTypeItem) {
    const confirmMsg =
      item.tableCount > 0
        ? tr(
            "Delete table type \"{name}\"? {count} table(s) currently assigned to this type will become uncategorized.",
            { name: item.name, count: item.tableCount },
          )
        : tr("Delete table type \"{name}\"?", { name: item.name });

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/admin/table-types", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(tr(data.error ?? "Failed to delete table type"));
        return;
      }

      toast.success(tr("Table type deleted"));
      router.refresh();
    } catch {
      toast.error(tr("Network error. Please try again."));
    }
  }

  return (
    <section className="space-y-4">
      <CardHeader className="mb-0 flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Layers className="text-emerald-bright" size={22} />
            {tr("Table types")}
          </CardTitle>
          <p className="mt-1 text-xs text-muted">
            {tr("Define the disciplines of your billiard club (Snooker, American Pool, Carom, etc.)")}
          </p>
        </div>
        <Button size="sm" onClick={openAddModal}>
          <Plus size={16} /> {tr("Add type")}
        </Button>
      </CardHeader>

      {types.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-10 text-center">
          <Layers className="mb-3 text-faint" size={36} />
          <p className="font-semibold">{tr("No table types yet")}</p>
          <p className="mt-1 text-xs text-muted max-w-sm">
            {tr("Add types like Snooker, American Pool, or Carom to categorize your billiard tables.")}
          </p>
          <Button size="sm" className="mt-4" onClick={openAddModal}>
            <Plus size={15} /> {tr("Add first table type")}
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {types.map((type) => (
            <Card
              key={type.id}
              className="group relative flex flex-col justify-between border-border hover:border-emerald-accent/40 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground text-base">
                    {type.name}
                  </h3>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {type.tableCount} {tr(type.tableCount === 1 ? "table" : "tables")}
                  </Badge>
                </div>

                <p className="mt-2 text-xs text-muted leading-relaxed min-h-[2.5rem]">
                  {type.description || tr("No description provided.")}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-end gap-1.5 border-t border-border pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditModal(type)}
                  className="h-8 px-2.5 text-xs text-muted hover:text-foreground"
                >
                  <Pencil size={13} className="me-1" />
                  {tr("Edit")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(type)}
                  className="h-8 px-2.5 text-xs text-muted hover:text-live"
                  aria-label={tr("Delete {name}", { name: type.name })}
                >
                  <Trash2 size={13} className="me-1" />
                  {tr("Delete")}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Dialog
        open={addOpen}
        onClose={() => !loading && setAddOpen(false)}
        title={tr("Add table type")}
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <Label htmlFor="tt-name">{tr("Type name")}</Label>
            <Input
              id="tt-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tr("e.g. Snooker 12ft, American Pool 9ft")}
              required
              minLength={2}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs text-muted">
              <Sparkles size={13} className="text-gold" />
              <span>{tr("Or pick a common billiard preset:")}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TYPE_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.name}
                  onClick={() => applyPreset(p)}
                  className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-muted hover:border-emerald-accent hover:text-emerald-bright transition-all"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="tt-desc">{tr("Description (optional)")}</Label>
            <Textarea
              id="tt-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tr("Details on table size, cloth type, pocket dimensions...")}
            />
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
              {tr("Create type")}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Modal */}
      <Dialog
        open={!!editItem}
        onClose={() => !loading && setEditItem(null)}
        title={tr("Edit table type")}
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <Label htmlFor="tt-edit-name">{tr("Type name")}</Label>
            <Input
              id="tt-edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
            />
          </div>

          <div>
            <Label htmlFor="tt-edit-desc">{tr("Description")}</Label>
            <Textarea
              id="tt-edit-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
