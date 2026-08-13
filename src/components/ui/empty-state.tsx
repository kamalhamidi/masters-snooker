import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-hover">
        <Icon className="h-6 w-6 text-faint" />
      </div>
      <p className="font-semibold text-foreground">{title}</p>
      {description && <p className="max-w-sm px-4 text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}
