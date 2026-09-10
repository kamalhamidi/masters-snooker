"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card } from "@/components/ui/card";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name") as string,
      email: form.get("email") as string,
      phone: (form.get("phone") as string) || "",
      password: form.get("password") as string,
    };

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.error ?? "We couldn’t create your account. Please try again.",
        );
        return;
      }

      // Auto login after signup — minimal friction
      const login = await signIn("credentials", {
        email: payload.email,
        password: payload.password,
        redirect: false,
      });
      if (login?.error) {
        toast.success("Your account is ready. Please log in to continue.");
        router.push("/login");
        return;
      }
      toast.success("Welcome to the club!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(
        "We couldn’t finish your request. If your account was created, try logging in.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md p-6 sm:p-8">
      <p className="eyebrow mb-3 text-gold">Your place in the club</p>
      <h1 className="font-display text-4xl tracking-wide">Join the club</h1>
      <p className="mt-1 text-sm text-muted">
        Free player account — takes under a minute. You can complete your
        profile later.
      </p>

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
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            required
            minLength={2}
            placeholder="Ronnie Osman"
            autoComplete="name"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <div>
          <Label htmlFor="phone">
            Phone <span className="text-faint">(optional)</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+20 100 000 0000"
            autoComplete="tel"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            name="password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </div>
        <Button className="w-full" size="lg" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Creating your account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already a member?{" "}
        <Link
          href="/login"
          className="font-semibold text-emerald-bright hover:underline"
        >
          Log in
        </Link>
      </p>
    </Card>
  );
}
