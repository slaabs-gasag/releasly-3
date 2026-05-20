"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useUserSettings } from "@/context/UserSettingsContext";
import { getProjects, getProjectReleases } from "@/services/api";
import type { ProjectSummary, Release } from "@/types/api";
import AppShell from "@/components/AppShell";
import ReleaseNotes, { extractTickets } from "@/components/ReleaseNotes";

export default function ReleaseDetailPage({
  params,
}: {
  params: Promise<{ id: string; version: string }>;
}) {
  const { id, version } = use(params);
  const { settings } = useUserSettings();

  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [release, setRelease] = useState<Release | null>(null);
  const [allReleases, setAllReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [projectList, resp] = await Promise.all([
          getProjects(settings),
          getProjectReleases(id, settings),
        ]);
        const found = projectList.find((p) => p.id === id) ?? null;
        setProject(found);
        setAllReleases(resp.releases);
        const decoded = decodeURIComponent(version);
        const rel = resp.releases.find((r) => r.version === decoded) ?? null;
        setRelease(rel);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, version, settings]);

  function formatDate(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("de-DE", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  }

  function relativeDate(iso: string | null): string {
    if (!iso) return "";
    const diff = Math.round((new Date().getTime() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "heute";
    if (diff === 1) return "gestern";
    if (diff < 14) return `vor ${diff} Tagen`;
    return formatDate(iso);
  }

  const decoded = decodeURIComponent(version);
  const idx = allReleases.findIndex((r) => r.version === decoded);
  const prevRelease = idx >= 0 ? allReleases[idx + 1] : undefined;
  const nextRelease = idx > 0 ? allReleases[idx - 1] : undefined;

  const tickets = release ? extractTickets(release.release_notes) : [];
  const convention = release?.naming_convention === "semver" ? "SemVer" :
                     release?.naming_convention === "date" ? "CalVer" : "";

  return (
    <AppShell>
      <div className="topbar">
        <div className="topbar__crumbs">
          <Link href="/">Dashboard</Link>
          <span className="sep">/</span>
          <Link href={`/projects/${id}`}>{project?.name ?? "Projekt"}</Link>
          <span className="sep">/</span>
          <span className="now">v{decoded}</span>
        </div>
        <div className="topbar__actions">
          {prevRelease && (
            <Link
              href={`/projects/${id}/releases/${encodeURIComponent(prevRelease.version)}`}
              className="btn btn--ghost btn--sm"
            >
              <ChevLeftIcon /> v{prevRelease.version}
            </Link>
          )}
          {nextRelease && (
            <Link
              href={`/projects/${id}/releases/${encodeURIComponent(nextRelease.version)}`}
              className="btn btn--ghost btn--sm"
            >
              v{nextRelease.version} <ChevRightIcon />
            </Link>
          )}
        </div>
      </div>

      <div className="page">
        {loading ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: "var(--app-fg-3)", font: "400 14px/1 var(--gs-font-mono)" }}>
            Release wird geladen…
          </div>
        ) : !release ? (
          <div className="card" style={{ padding: "48px", textAlign: "center", color: "var(--app-fg-3)" }}>
            Release v{decoded} nicht gefunden.{" "}
            <Link href={`/projects/${id}`}>Zurück zum Projekt</Link>
          </div>
        ) : (
          <>
            {/* Hero */}
            <div className="rel-hero">
              <div>
                <h1>
                  v{release.version}
                  {convention && <span className="scheme">{convention}</span>}
                </h1>
                <div className="rel-hero__sub">
                  <span className="chip chip--released">
                    <span className="chip-dot" />
                    Veröffentlicht
                  </span>
                  {release.release_date && (
                    <span style={{ font: "400 14px/1 var(--gs-font-sans)", color: "var(--app-fg-2)" }}>
                      Veröffentlicht am <b>{formatDate(release.release_date)}</b> · {relativeDate(release.release_date)}
                    </span>
                  )}
                  {release.source === "cache" && (
                    <span className="chip chip--stale">Zwischengespeichert</span>
                  )}
                </div>
              </div>
              <div className="rel-hero__meta">
                <div className="rel-hero__meta-row">
                  <span className="lbl">Projekt</span>
                  <span className="val">{project?.name ?? "—"}</span>
                </div>
                <div className="rel-hero__meta-row">
                  <span className="lbl">Versionsschema</span>
                  <span className="val">{convention || "—"}</span>
                </div>
                {!release.is_convention_match && (
                  <div className="rel-hero__meta-row">
                    <span className="lbl">Hinweis</span>
                    <span className="val" style={{ color: "var(--gs-warning-fg)" }}>Schema weicht ab</span>
                  </div>
                )}
                {tickets.length > 0 && (
                  <div className="rel-hero__meta-row">
                    <span className="lbl">Tickets</span>
                    <span className="val">{tickets.length} verlinkt</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes + sidebar */}
            <div className={tickets.length > 0 ? "rn-layout-side" : "rn-layout-doc"}>
              <ReleaseNotes notes={release.release_notes} />

              {tickets.length > 0 && (
                <div className="notes-side">
                  <div className="card">
                    <div className="card__hd">
                      <h3>Tickets</h3>
                      <span className="grow" />
                      <span style={{ font: "400 12px/1 var(--gs-font-sans)", color: "var(--app-fg-3)" }}>
                        {tickets.length} verlinkt
                      </span>
                    </div>
                    <div className="tickets-table">
                      {tickets.map((t) => (
                        <div key={t.id} className="tickets-table__row">
                          <span className="id">{t.id}</span>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {t.label || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card">
                    <div className="card__hd"><h3>Meta</h3></div>
                    <div className="kv">
                      <div className="kv__row">
                        <span className="lbl">Version</span>
                        <span className="val">v{release.version}</span>
                      </div>
                      <div className="kv__row">
                        <span className="lbl">Veröffentlicht</span>
                        <span className="val">{formatDate(release.release_date)}</span>
                      </div>
                      {prevRelease && (
                        <div className="kv__row">
                          <span className="lbl">Vorgänger</span>
                          <span className="val">v{prevRelease.version}</span>
                        </div>
                      )}
                      <div className="kv__row">
                        <span className="lbl">Datenquelle</span>
                        <span className="val">{release.source === "cache" ? "Cache" : "Live"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function ChevLeftIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}

function ChevRightIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
