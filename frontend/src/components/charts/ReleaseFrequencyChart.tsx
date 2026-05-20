"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ReleaseStats } from "@/types/api";

interface Props {
  stats: ReleaseStats[];
}

export default function ReleaseFrequencyChart({ stats }: Props) {
  // Build a unified weekly dataset across all projects
  const allWeeks = Array.from(
    new Set(stats.flatMap((s) => s.weekly_counts.map((w) => w.week)))
  ).sort();

  const data = allWeeks.map((week) => {
    const entry: Record<string, string | number> = { week };
    stats.forEach((s) => {
      const match = s.weekly_counts.find((w) => w.week === week);
      entry[s.project_name] = match?.count ?? 0;
    });
    return entry;
  });

  const colors = [
    "#2563eb", "#16a34a", "#d97706", "#dc2626",
    "#7c3aed", "#0891b2", "#be185d", "#65a30d",
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value, name) => [value, name]}
          labelFormatter={(label) => `Week: ${label}`}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {stats.map((s, i) => (
          <Bar
            key={s.project_id}
            dataKey={s.project_name}
            fill={colors[i % colors.length]}
            stackId="a"
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
