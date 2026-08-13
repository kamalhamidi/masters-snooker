import { cn, initials } from "@/lib/utils";

const SIZES = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
} as const;

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn("rounded-full object-cover ring-2 ring-border", SIZES[size], className)}
      />
    );
  }
  return (
    <div
      aria-label={name}
      className={cn(
        "flex items-center justify-center rounded-full bg-felt-light font-bold text-emerald-bright ring-2 ring-border select-none",
        SIZES[size],
        className
      )}
    >
      {initials(name)}
    </div>
  );
}
