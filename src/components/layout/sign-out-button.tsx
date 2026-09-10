"use client";

import { useI18n } from "@/lib/i18n/provider";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  const { tr } = useI18n();

  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-live/10 hover:text-live"
    >
      <LogOut size={19} />
      {tr("Sign out")}
    </button>
  );
}
