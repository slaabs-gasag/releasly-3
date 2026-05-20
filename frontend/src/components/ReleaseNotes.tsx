import type { ReactNode } from "react";

interface Props {
  notes: string | null | undefined;
}

const TICKET_RE = /\[([A-Z]{1,6}-\d+)\]/g;
const BOLD_CODE_RE = /\*\*(.+?)\*\*|`([^`]+)`/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const segments: Array<{ type: "text" | "ticket"; value: string }> = [];
  let last = 0;
  TICKET_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TICKET_RE.exec(text)) !== null) {
    if (m.index > last) segments.push({ type: "text", value: text.slice(last, m.index) });
    segments.push({ type: "ticket", value: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ type: "text", value: text.slice(last) });

  return segments.map((seg, idx) => {
    if (seg.type === "ticket") {
      return (
        <span key={`${keyPrefix}-${idx}`} className="tkt">
          {seg.value}
        </span>
      );
    }
    const t = seg.value;
    const parts: ReactNode[] = [];
    let p = 0;
    BOLD_CODE_RE.lastIndex = 0;
    let mm: RegExpExecArray | null;
    while ((mm = BOLD_CODE_RE.exec(t)) !== null) {
      if (mm.index > p) parts.push(t.slice(p, mm.index));
      if (mm[1] !== undefined) parts.push(<strong key={`${keyPrefix}-b${mm.index}`}>{mm[1]}</strong>);
      else if (mm[2] !== undefined) parts.push(<code key={`${keyPrefix}-c${mm.index}`}>{mm[2]}</code>);
      p = mm.index + mm[0].length;
    }
    if (p < t.length) parts.push(t.slice(p));
    return <span key={`${keyPrefix}-${idx}`}>{parts}</span>;
  });
}

export default function ReleaseNotes({ notes }: Props) {
  if (!notes) {
    return (
      <div className="rn">
        <p style={{ color: "var(--app-fg-3)", fontStyle: "italic" }}>Keine Release Notes vorhanden.</p>
      </div>
    );
  }

  const blocks: ReactNode[] = [];
  const lines = notes.split("\n");
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (/^###\s+/.test(line)) {
      blocks.push(<h3 key={key++}>{renderInline(line.replace(/^###\s+/, ""), `k${key}`)}</h3>);
      i++;
    } else if (/^##\s+/.test(line)) {
      blocks.push(<h2 key={key++}>{renderInline(line.replace(/^##\s+/, ""), `k${key}`)}</h2>);
      i++;
    } else if (/^#\s+/.test(line)) {
      blocks.push(<h2 key={key++}>{renderInline(line.replace(/^#\s+/, ""), `k${key}`)}</h2>);
      i++;
    } else if (/^>\s+/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s+/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s+/, ""));
        i++;
      }
      blocks.push(<blockquote key={key++}>{renderInline(buf.join(" "), `k${key}`)}</blockquote>);
    } else if (/^-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^-\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++}>
          {items.map((it, ix) => (
            <li key={ix}>{renderInline(it, `k${key}-${ix}`)}</li>
          ))}
        </ul>
      );
    } else if (line.trim() === "") {
      i++;
    } else {
      const buf = [line];
      i++;
      while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,3}\s|>\s|-\s)/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      blocks.push(<p key={key++}>{renderInline(buf.join(" "), `k${key}`)}</p>);
    }
  }

  return <div className="rn">{blocks}</div>;
}

export function extractTickets(md: string | null): { id: string; label: string }[] {
  if (!md) return [];
  const re = /\[([A-Z]{1,6}-\d+)\]/g;
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) seen.add(m[1]);

  return Array.from(seen).map((id) => {
    const lineRe = new RegExp(`^.*\\[${id}\\][^\\n]*$`, "m");
    const match = md.match(lineRe);
    const label = match
      ? match[0].replace(/^[-*#>\s]+/, "").replace(/\[[A-Z]{1,6}-\d+\]\s*/g, "").replace(/\*\*/g, "").trim()
      : "";
    return { id, label };
  });
}
