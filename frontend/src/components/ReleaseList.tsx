"use client";

import { useState } from "react";
import Link from "next/link";
import type { Release } from "@/types/api";

interface Props {
  releases: Release[];
  projectId: string;
  view?: "timeline" | "list";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function shortDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
}

function relativeDate(iso: string | null): string {
  if (!iso) return "";
  const diff = Math.round((new Date().getTime() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "heute";
  if (diff === 1) return "gestern";
  if (diff < 14) return `vor ${diff} Tagen`;
  if (diff < 60) return `vor ${Math.round(diff / 7)} Wochen`;
  return formatDate(iso);
}

function titleFromNotes(notes: string | null): string {
  if (!notes) return "Release";
  const m = notes.match(/^##\s+(.+)$/m);
  return m ? m[1].replace(/\*\*/g, "") : "Release";
}

export default function ReleaseList({ releases, projectId, view = "timeline" }: Props) {
  const [activeView, setActiveView] = useState<"timeline" | "list">(view);

  if (releases.length === 0) {
    return (
      <div className="card" style={{ padding: "48px", textAlign: "center", color: "var(--app-fg-3)" }}>
        Keine Releases gefunden.
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8, gap: 4 }}>
        <button
          className={"iconbtn" + (activeView === "timeline" ? " is-active" : "")}
          onClick={() => setActiveView("timeline")}
          title="Timeline"
        >
          <TimelineIcon />
        </button>
        <button
          className={"iconbtn" + (activeView === "list" ? " is-active" : "")}
          onClick={() => setActiveView("list")}
          title="Liste"
        >
          <ListIcon />
        </button>
      </div>

      {activeView === "list" ? (
        <div className="card">
          <div className="rel-list--head">
            <div>Version</div>
            <div>Status</div>
            <div>Titel</div>
            <div />
          </div>
          <div className="rel-list">
            {releases.map((r) => (
              <Link
                key={r.version}
                href={`/projects/${projectId}/releases/${encodeURIComponent(r.version)}`}
                className="rel-row"
              >
                <span className="ver" style={{ fontSize: 14 }}>v{r.version}</span>
                <span className="chip chip--released">
                  <span className="chip-dot" />
                  Veröffentlicht
                </span>
                <div>
                  <div className="title">{titleFromNotes(r.release_notes)}</div>
                  <div className="date">{formatDate(r.release_date)}</div>
                </div>
                <ChevRightIcon />
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="timeline">
            <div className="timeline__axis" />
            {releases.map((r) => (
              <Link
                key={r.version}
                href={`/projects/${projectId}/releases/${encodeURIComponent(r.version)}`}
                className="tl-row"
              >
                <div className="tl-row__date">
                  <b>{shortDate(r.release_date)}</b>
                  <span>{relativeDate(r.release_date)}</span>
                </div>
                <div className="tl-row__node is-released" />
                <div className="tl-row__card">
                  <div className="tl-row__card-hd">
                    <span className="ver" style={{ fontSize: 16 }}>v{r.version}</span>
                    <span className="chip chip--released">
                      <span className="chip-dot" />
                      Veröffentlicht
                    </span>
                    {r.source === "cache" && (
                      <span className="chip chip--stale">Cache</span>
                    )}
                    {!r.is_convention_match && (
                      <span className="chip" title="Versionsschema weicht ab">⚠ Schema</span>
                    )}
                  </div>
                  <div className="tl-row__title">{titleFromNotes(r.release_notes)}</div>
                  <div className="tl-row__meta">{formatDate(r.release_date)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="4" x2="6" y2="20"/>
      <circle cx="6" cy="7" r="2" fill="currentColor" stroke="none"/>
      <circle cx="6" cy="13" r="2" fill="currentColor" stroke="none"/>
      <circle cx="6" cy="19" r="2" fill="currentColor" stroke="none"/>
      <line x1="11" y1="7" x2="20" y2="7"/>
      <line x1="11" y1="13" x2="18" y2="13"/>
      <line x1="11" y1="19" x2="20" y2="19"/>
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  );
}

function ChevRightIcon() {
  return (
    <svg className="ico chev" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
