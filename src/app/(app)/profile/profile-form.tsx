"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export function ProfileForm({
  defaults,
  hasBio,
}: {
  defaults: { name: string; phone: string; bio: string; avatarUrl: string };
  hasBio: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        phone: form.get("phone") ?? "",
        bio: form.get("bio") ?? "",
        avatarUrl: form.get("avatarUrl") ?? "",
      }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Could not save profile");
      return;
    }
    toast.success("Profile updated");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit profile</CardTitle>
      </CardHeader>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Display name</Label>
          <Input id="name" name="name" defaultValue={defaults.name} required minLength={2} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={defaults.phone} placeholder="+20 100 000 0000" />
        </div>
        <div>
          <Label htmlFor="avatarUrl">Avatar URL</Label>
          <Input id="avatarUrl" name="avatarUrl" type="url" defaultValue={defaults.avatarUrl} placeholder="https://…" />
        </div>
        {hasBio && (
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" name="bio" rows={3} maxLength={300} defaultValue={defaults.bio} placeholder="Highest break, favourite table, playing style…" />
          </div>
        )}
        <Button disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </form>
    </Card>
  );
}
