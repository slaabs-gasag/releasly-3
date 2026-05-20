interface Props {
  status: "planned" | "in-development" | "rc" | "released" | "hotfix";
}

const LABELS: Record<Props["status"], string> = {
  "planned":        "Geplant",
  "in-development": "In Entwicklung",
  "rc":             "Release Candidate",
  "released":       "Veröffentlicht",
  "hotfix":         "Hotfix",
};

export default function StatusChip({ status }: Props) {
  return (
    <span className={`chip chip--${status}`}>
      <span className="chip-dot" />
      {LABELS[status]}
    </span>
  );
}
