"use client";

import { useI18n } from "@/lib/i18n/provider";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import type { Role } from "@prisma/client";

type StaffMember = {
  userId: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  position: string;
  matchesManaged: number;
};

export function StaffManager({ employees }: { employees: StaffMember[] }) {
  const { tr } = useI18n();

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function addStaff(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        position: form.get("position"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      toast.error(tr(data.error ?? tr("Could not add employee")));
      return;
    }
    toast.success(tr("Employee account created"));
    setOpen(false);
    router.refresh();
  }

  async function removeStaff(userId: string, name: string) {
    if (
      !window.confirm(
        tr("Remove {name}'s staff account? This can't be undone.", { name }),
      )
    )
      return;
    const res = await fetch("/api/admin/staff", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(tr(data.error ?? tr("Could not remove employee")));
      return;
    }
    toast.success(tr("Employee removed"));
    router.refresh();
  }

  return (
    <section>
      <CardHeader className="mb-4">
        <CardTitle className="text-2xl">{tr("Staff accounts")}</CardTitle>
        <Button size="sm" onClick={() => setOpen(true)}>
          <UserPlus size={15} /> {tr("Add employee")}
        </Button>
      </CardHeader>

      <div className="grid gap-3 sm:grid-cols-2">
        {employees.map((e) => (
          <Card key={e.userId} className="flex items-center gap-3 py-4">
            <Avatar name={e.name} src={e.avatarUrl} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{e.name}</p>
              <p className="truncate text-xs text-muted">{e.email}</p>
              <p className="mt-0.5 text-xs text-faint">
                {e.position} · {e.matchesManaged} {tr("matches managed")}
              </p>
            </div>
            {e.role === "CHEF" ? (
              <Badge variant="gold">{tr("owner")}</Badge>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                aria-label={tr("Remove {name}", { name: e.name })}
                onClick={() => removeStaff(e.userId, e.name)}
                className="text-muted hover:text-live"
              >
                <Trash2 size={16} />
              </Button>
            )}
          </Card>
        ))}
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={tr("Add employee")}
      >
        <form onSubmit={addStaff} className="space-y-4">
          <div>
            <Label htmlFor="st-name">{tr("Full name")}</Label>
            <Input id="st-name" name="name" required minLength={2} />
          </div>
          <div>
            <Label htmlFor="st-email">{tr("Email")}</Label>
            <Input id="st-email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="st-position">{tr("Position")}</Label>
            <Input
              id="st-position"
              name="position"
              required
              placeholder={tr("Floor Manager")}
            />
          </div>
          <div>
            <Label htmlFor="st-password">{tr("Temporary password")}</Label>
            <Input
              id="st-password"
              name="password"
              type="text"
              required
              minLength={8}
              placeholder={tr("min 8 characters")}
            />
          </div>
          <Button className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {tr("Create account")}
          </Button>
        </form>
      </Dialog>
    </section>
  );
}
