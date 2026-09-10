import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex shrink-0 items-center gap-2.5",
        className,
      )}
    >
      <span className="relative hidden min-[360px]:flex h-9 w-9 items-center justify-center rounded-full bg-felt ring-2 ring-gold/60 transition-transform group-hover:scale-105">
        {/* cue ball + red ball motif */}
        <span className="absolute left-1.5 top-2 h-3 w-3 rounded-full bg-[#f8f6f0] shadow-sm" />
        <span className="absolute bottom-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-live shadow-sm" />
      </span>
      <span className="font-display text-xl leading-none tracking-wider sm:text-2xl">
        MASTER&apos;S<span className="text-gold"> SNOOKER</span>
      </span>
    </Link>
  );
}
