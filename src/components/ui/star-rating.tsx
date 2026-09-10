"use client";

import { useI18n } from "@/lib/i18n/provider";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 24,
  label,
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: number;
  label?: string;
}) {
  const { tr } = useI18n();

  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div
      className="flex items-center gap-1"
      role={readOnly ? undefined : "radiogroup"}
      aria-label={label ?? tr("Rating")}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          aria-label={tr("{count} out of 5 stars", { count: n })}
          aria-checked={value === n}
          role={readOnly ? undefined : "radio"}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => setHover(0)}
          className={cn(
            "transition-transform",
            !readOnly && "cursor-pointer hover:scale-110",
          )}
        >
          <Star
            size={size}
            className={cn(
              "transition-colors",
              n <= active ? "fill-gold text-gold" : "text-border-strong",
            )}
          />
        </button>
      ))}
    </div>
  );
}
