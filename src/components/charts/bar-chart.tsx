"use client";

import { useI18n } from "@/lib/i18n/provider";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function SimpleBarChart({
  data,
  color = "#10b981",
  height = 220,
  valueFormatter,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  valueFormatter?: (v: number) => string;
}) {
  const { locale } = useI18n();
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -14 }}
        >
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--text-faint)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: "var(--text-faint)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) =>
              valueFormatter ? valueFormatter(v) : v.toLocaleString(locale)
            }
          />
          <Tooltip
            cursor={{ fill: "var(--surface-hover)" }}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--text)",
              fontSize: 13,
            }}
            formatter={(v) => [
              valueFormatter
                ? valueFormatter(Number(v))
                : Number(v).toLocaleString(locale),
              "",
            ]}
          />
          <Bar
            dataKey="value"
            fill={color}
            radius={[6, 6, 0, 0]}
            maxBarSize={42}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
