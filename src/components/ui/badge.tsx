import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-surface-hover text-muted border border-border",
        emerald: "bg-emerald-accent/15 text-emerald-bright border border-emerald-accent/30",
        gold: "bg-gold/15 text-gold-soft border border-gold/30",
        live: "bg-live/15 text-live border border-live/30",
        blue: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
        purple: "bg-violet-500/15 text-violet-400 border border-violet-500/30",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

const MATCH_TYPE_VARIANT = {
  FRIENDLY: "default",
  RANKED: "emerald",
  TOURNAMENT: "blue",
  CHAMPIONSHIP: "gold",
} as const;

export function MatchTypeBadge({ type }: { type: keyof typeof MATCH_TYPE_VARIANT }) {
  return (
    <Badge variant={MATCH_TYPE_VARIANT[type]}>
      {type.charAt(0) + type.slice(1).toLowerCase()}
    </Badge>
  );
}

export function LiveBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-live px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white animate-pulse-live",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white" />
      Live
    </span>
  );
}
