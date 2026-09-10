"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card } from "@/components/ui/card";

function LoginFormInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await signIn("credentials", {
        email: form.get("email"),
        password: form.get("password"),
        redirect: false,
      });
      if (res?.error) {
        setError("That email and password don’t match. Please try again.");
        return;
      }
      toast.success("Welcome back!");
      const callback = params.get("callbackUrl");
      router.push(
        callback?.startsWith("/") && !callback.startsWith("//")
          ? callback
          : "/dashboard",
      );
      router.refresh();
    } catch {
      setError(
        "We couldn’t connect. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md p-6 sm:p-8">
      <p className="eyebrow mb-3 text-gold">Back at the table</p>
      <h1 className="font-display text-4xl tracking-wide">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Log in to your club account.</p>

      <form onSubmit={onSubmit} className="mt-7 space-y-4" aria-busy={loading}>
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-live/30 bg-live/10 p-3 text-sm text-live"
          >
            {error}
          </p>
        )}
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>
        <Button className="w-full" size="lg" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <div className="mt-6 rounded-xl border border-border bg-elevated/60 p-4 text-xs text-muted">
        <p className="mb-1.5 font-semibold text-foreground">
          Demo accounts (password: password123)
        </p>
        <p>Player — ronnie@demo.club</p>
        <p>Employee — sara@masters.club</p>
        <p>Owner — chef@masters.club</p>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        New to the club?{" "}
        <Link
          href="/register"
          className="font-semibold text-emerald-bright hover:underline"
        >
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
