"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Legend,
} from "recharts";
import type { ReleaseStats } from "@/types/api";

interface Props {
  stats: ReleaseStats[];
}

export default function CadenceComparisonChart({ stats }: Props) {
  const data = stats.map((s) => ({
    name: s.project_name,
    actual: s.average_cycle_days,
    target: s.configured_cycle_days,
    on_track: s.on_track,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis
          tick={{ fontSize: 11 }}
          label={{
            value: "days",
            angle: -90,
            position: "insideLeft",
            style: { fontSize: 10 },
          }}
        />
        <Tooltip
          formatter={(value, name) => [
            `${value} days`,
            name === "actual" ? "Actual cycle" : "Target cycle",
          ]}
        />
        <Legend
          wrapperStyle={{ fontSize: 11 }}
          formatter={(value) =>
            value === "actual" ? "Actual cycle (days)" : "Target (days)"
          }
        />
        <Bar dataKey="actual" name="actual" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.on_track ? "#16a34a" : "#dc2626"}
            />
          ))}
        </Bar>
        <Bar dataKey="target" name="target" fill="#93c5fd" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
