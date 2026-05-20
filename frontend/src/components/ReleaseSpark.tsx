"use client";

interface Props {
  releases: { release_date: string | null }[];
}

export default function ReleaseSpark({ releases }: Props) {
  const now = new Date();
  const buckets: { key: string; count: number; label: string }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      count: 0,
      label: d.toLocaleDateString("de-DE", { month: "short" }),
    });
  }

  releases.forEach((r) => {
    if (!r.release_date) return;
    const d = new Date(r.release_date);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    const b = buckets.find((x) => x.key === k);
    if (b) b.count++;
  });

  const max = Math.max(1, ...buckets.map((b) => b.count));
  const W = 120, H = 40, bw = W / buckets.length - 4;

  return (
    <svg width={W} height={H + 14} style={{ display: "block" }}>
      {buckets.map((b, i) => {
        const h = (b.count / max) * H;
        return (
          <g key={i} transform={`translate(${i * (bw + 4)},0)`}>
            <rect
              x="0" y={H - h}
              width={bw} height={h || 2}
              fill="var(--gs-blue-700)"
              opacity={b.count ? 1 : 0.18}
            />
            <text
              x={bw / 2} y={H + 11}
              textAnchor="middle" fontSize="9"
              fontFamily="var(--gs-font-mono)"
              fill="var(--app-fg-3)"
            >
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
