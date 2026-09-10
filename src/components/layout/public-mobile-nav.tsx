"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";

export function PublicMobileNav({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Open navigation"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-surface-hover lg:hidden"
      >
        <Menu size={22} />
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Explore the club"
      >
        <nav aria-label="Public mobile navigation" className="space-y-1">
          {[
            ["/#about", "The club"],
            ["/#tournaments", "Tournaments"],
            ["/leaderboard", "Leaderboard"],
            ["/live", "Watch live"],
            ["/reservations", "Book a table"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-xl px-3 py-4 text-lg hover:bg-surface-hover"
            >
              {label}
              <ArrowUpRight size={18} className="text-gold" />
            </Link>
          ))}
          <Link
            href={signedIn ? "/dashboard" : "/login"}
            onClick={() => setOpen(false)}
            className={buttonVariants({
              className: "mt-4 w-full",
              variant: "gold",
            })}
          >
            {signedIn ? "My dashboard" : "Member login"}
          </Link>
        </nav>
      </Dialog>
    </>
  );
}
