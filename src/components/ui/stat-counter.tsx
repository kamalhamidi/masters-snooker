"use client";

import { useI18n } from "@/lib/i18n/provider";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

export function StatCounter({
  value,
  suffix = "",
  prefix = "",
  className,
  duration = 1200,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  duration?: number;
}) {
  const { locale } = useI18n();

  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || reducedMotion) return;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, reducedMotion]);

  return (
    <span
      ref={ref}
      className={className}
      aria-label={`${prefix}${value.toLocaleString(locale)}${suffix}`}
    >
      <span aria-hidden="true">
        {prefix}
        {(reducedMotion ? value : display).toLocaleString(locale)}
        {suffix}
      </span>
    </span>
  );
}
