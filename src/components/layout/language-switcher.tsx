"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Globe, Loader2 } from "lucide-react";
import { isLocale, localeCookie, localeNames, locales } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";

export function LanguageSwitcher() {
  const { language, tr } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="relative flex h-11 shrink-0 items-center">
      {pending ? (
        <Loader2
          aria-hidden
          size={15}
          className="pointer-events-none absolute start-2 animate-spin text-muted"
        />
      ) : (
        <Globe
          aria-hidden
          size={15}
          className="pointer-events-none absolute start-2 text-muted"
        />
      )}
      <select
        aria-label={tr("Language")}
        aria-busy={pending}
        value={language}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value;
          if (!isLocale(next)) return;
          document.cookie = `${localeCookie}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
          startTransition(() => router.refresh());
        }}
        className="h-11 w-[80px] appearance-none rounded-xl border border-border bg-elevated ps-7 pe-2 text-xs font-semibold text-foreground disabled:opacity-60"
      >
        {locales.map((code) => (
          <option key={code} value={code} lang={code}>
            {localeNames[code]}
          </option>
        ))}
      </select>
      <span className="sr-only" role="status">
        {pending ? tr("Changing language…") : ""}
      </span>
    </div>
  );
}
