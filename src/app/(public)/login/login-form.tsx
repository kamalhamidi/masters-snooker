"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

function LoginFormInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      toast.error("Invalid email or password");
      return;
    }
    toast.success("Welcome back!");
    router.push(params.get("callbackUrl") ?? "/dashboard");
    router.refresh();
  }

  return (
    <Card glass className="w-full max-w-md p-8">
      <h1 className="font-display text-4xl tracking-wide">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Log in to your club account.</p>

      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" placeholder="••••••••" />
        </div>
        <Button className="w-full" size="lg" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Log in
        </Button>
      </form>

      <div className="mt-6 rounded-xl border border-border bg-elevated/60 p-4 text-xs text-muted">
        <p className="mb-1.5 font-semibold text-foreground">Demo accounts (password: password123)</p>
        <p>Player — ronnie@demo.club</p>
        <p>Employee — sara@masters.club</p>
        <p>Owner — chef@masters.club</p>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        New to the club?{" "}
        <Link href="/register" className="font-semibold text-emerald-bright hover:underline">
          Create an account
        </Link>
      </p>
    </Card>
  );
}

export function LoginForm() {
  return (
    <Suspense>
      <LoginFormInner />
    </Suspense>
  );
}
