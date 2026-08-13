"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function PointsChart({
  data,
}: {
  data: { date: string; points: number }[];
}) {
  if (data.length < 2) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-faint">
        Play ranked matches to build your points history.
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
          <defs>
            <linearGradient id="pointsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--text-faint)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={40}
            tickFormatter={(d: string) =>
              new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            }
          />
          <YAxis
            domain={["dataMin - 20", "dataMax + 20"]}
            tick={{ fill: "var(--text-faint)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--text)",
              fontSize: 13,
            }}
            labelFormatter={(d) =>
              new Date(d as string).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })
            }
          />
          <Area
            type="monotone"
            dataKey="points"
            stroke="#34d399"
            strokeWidth={2.5}
            fill="url(#pointsFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
