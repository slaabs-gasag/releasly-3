"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useUserSettings } from "@/context/UserSettingsContext";
import { getProjects, getProjectReleases } from "@/services/api";
import type { ProjectSummary, Release } from "@/types/api";
import AppShell from "@/components/AppShell";
import ReleaseList from "@/components/ReleaseList";
import ReleaseSpark from "@/components/ReleaseSpark";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { settings } = useUserSettings();

  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [source, setSource] = useState<"live" | "cache">("live");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [projectList, resp] = await Promise.all([
          getProjects(settings),
          getProjectReleases(id, settings),
        ]);
        const found = projectList.find((p) => p.id === id);
        setProject(found ?? null);
        setReleases(resp.releases);
        setSource(resp.source);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Fehler beim Laden");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, settings]);

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

  const convention = project?.naming_convention === "semver" ? "SemVer (x.y.z)" :
                     project?.naming_convention === "date" ? "CalVer (YYYY.MM.p)" : "Unbekannt";

  return (
    <AppShell>
      <div className="topbar">
        <div className="topbar__crumbs">
          <Link href="/">Dashboard</Link>
          <span className="sep">/</span>
          <span className="now">{project?.name ?? "Projekt"}</span>
        </div>
        <div className="topbar__actions">
          {project && (
            <>
              <Link href={`/projects/${id}/edit`} className="btn btn--ghost btn--sm">
                Bearbeiten
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="page">
        {error && (
          <div className="card" style={{ padding: "16px 20px", marginBottom: "var(--sec-gap)", borderColor: "var(--gs-error-border)", background: "var(--gs-error-bg)", color: "var(--gs-error-fg)" }}>
            {error.includes("401") ? (
              <>Authentifizierung fehlgeschlagen. <Link href="/setup">Zugangsdaten aktualisieren</Link></>
            ) : (
              "Daten konnten nicht geladen werden."
            )}
          </div>
        )}

        {source === "cache" && !loading && (
          <div className="card" style={{ padding: "12px 20px", marginBottom: "var(--sec-gap)", borderColor: "var(--gs-warning-border)", background: "var(--gs-warning-bg)", color: "var(--gs-warning-fg)" }}>
            Zwischengespeicherte Daten — Live-Integration nicht erreichbar.
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: "var(--app-fg-3)", font: "400 14px/1 var(--gs-font-mono)" }}>
            Projekt wird geladen…
          </div>
        ) : (
          <>
            {/* Hero */}
            {project && (
              <div className="proj-hero">
                <div className="proj-hero__title">
                  <h1>{project.name}</h1>
                  <div className="meta">
                    <span>{project.source === "youtrack" ? "YouTrack" : "Azure DevOps"}</span>
                    {project.is_overdue && (
                      <span className="chip chip--overdue" style={{ marginLeft: 8 }}>
                        <span className="chip-dot" />
                        Überfällig
                      </span>
                    )}
                    {project.data_stale && (
                      <span className="chip chip--stale" style={{ marginLeft: 8 }}>
                        <span className="chip-dot" />
                        Daten veraltet
                      </span>
                    )}
                  </div>
                </div>
                <div className="proj-hero__meta">
                  <div className="stat">
                    <span className="stat__label">Kadenz</span>
                    <span className="stat__val" style={{ fontSize: 14 }}>Alle {project.release_cycle_days} Tage</span>
                  </div>
                  <div className="stat">
                    <span className="stat__label">Versionierung</span>
                    <span className="stat__val" style={{ fontSize: 14 }}>{convention}</span>
                  </div>
                  <div className="stat">
                    <span className="stat__label">Release-Frequenz · 6M</span>
                    <span className="stat__val">
                      <ReleaseSpark releases={releases} />
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat__label">Releases gesamt</span>
                    <span className="stat__val">{releases.length}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Version strip */}
            {project && (
              <div className="proj-version-strip">
                <div>
                  <span className="lbl current">Aktuell in Produktion</span>
                  {project.current_version ? (
                    <>
                      <span className="ver ver--big">v{project.current_version}</span>
                      <div className="sub">
                        seit {formatDate(project.last_release_date)} · {relativeDate(project.last_release_date)}
                      </div>
                    </>
                  ) : (
                    <span className="muted">Noch kein Release</span>
                  )}
                </div>
                <div>
                  <span className="lbl">Nächstes Release</span>
                  <span className="muted" style={{ font: "400 14px/1 var(--gs-font-sans)" }}>— keines geplant —</span>
                </div>
              </div>
            )}

            {/* Releases */}
            <div className="section-hd">
              <h2>
                Vergangene Releases
                <span>{releases.length}</span>
              </h2>
            </div>
            <ReleaseList releases={releases} projectId={id} />
          </>
        )}
      </div>
    </AppShell>
  );
}
