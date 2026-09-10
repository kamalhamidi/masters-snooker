"use client";

import { useI18n } from "@/lib/i18n/provider";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { tr } = useI18n();

  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={title ? titleId : undefined}
      aria-label={title ? undefined : tr("Dialog")}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="app-dialog fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-foreground backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="pointer-events-none flex min-h-full items-end justify-center sm:items-center sm:p-6">
        <div
          className={cn(
            "pointer-events-auto max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border border-border-strong bg-elevated p-6 shadow-2xl sm:max-w-lg sm:rounded-3xl",
            className,
          )}
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            {title && (
              <h2 id={titleId} className="font-display text-3xl tracking-wide">
                {tr(title)}
              </h2>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={tr("Close dialog")}
              className="ms-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              <X size={20} />
            </button>
          </div>
          {open && children}
        </div>
      </div>
    </dialog>
  );
}
