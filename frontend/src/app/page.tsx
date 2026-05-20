"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserSettings } from "@/context/UserSettingsContext";
import { getProjects } from "@/services/api";
import type { ProjectSummary } from "@/types/api";
import AppShell from "@/components/AppShell";
import ReleaseSpark from "@/components/ReleaseSpark";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function relativeDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "heute";
  if (diff === 1) return "gestern";
  if (diff < 14) return `vor ${diff} Tagen`;
  if (diff < 60) return `vor ${Math.round(diff / 7)} Wochen`;
  return formatDate(iso);
}

export default function DashboardPage() {
  const { settings, initialized, hasCredentials } = useUserSettings();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) return;
    if (!hasCredentials()) {
      router.replace("/setup");
      return;
    }
    getProjects(settings)
      .then(setProjects)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Fehler beim Laden"))
      .finally(() => setLoading(false));
  }, [settings, initialized, hasCredentials, router]);

  const overdue = projects.filter((p) => p.is_overdue).length;
  const stale = projects.filter((p) => p.data_stale).length;
  const lastRelease = projects
    .filter((p) => p.last_release_date)
    .sort((a, b) => new Date(b.last_release_date!).getTime() - new Date(a.last_release_date!).getTime())[0];

  return (
    <AppShell>
      <div className="topbar">
        <div className="topbar__crumbs">
          <span className="now">Dashboard</span>
        </div>
        <div className="topbar__actions">
          <Link href="/projects/new" className="btn btn--sm">
            + Projekt hinzufügen
          </Link>
        </div>
      </div>

      <div className="page">
        <div className="page__hd">
          <div>
            <h1>Release-Übersicht</h1>
            <p>Aktueller Stand aller {projects.length} Projekte.</p>
          </div>
        </div>

        {error && (
          <div className="card" style={{ padding: "16px 20px", marginBottom: "var(--sec-gap)", borderColor: "var(--gs-error-border)", background: "var(--gs-error-bg)", color: "var(--gs-error-fg)" }}>
            Backend nicht erreichbar. Bitte Server prüfen.
          </div>
        )}

        {!loading && (
          <div className="summary-strip">
            <div>
              <span className="lbl">Projekte</span>
              <span className="val">{projects.length}</span>
              <span className="sub">konfiguriert</span>
            </div>
            <div>
              <span className="lbl">Überfällig</span>
              <span className="val">{overdue}</span>
              <span className="sub">{overdue === 0 ? "alles im Plan" : "Release-Zyklus überschritten"}</span>
            </div>
            <div>
              <span className="lbl">Veraltete Daten</span>
              <span className="val">{stale}</span>
              <span className="sub">{stale === 0 ? "alle aktuell" : "Cache älter als 10 Min."}</span>
            </div>
            <div>
              <span className="lbl">Letzter Release</span>
              <span className="val" style={{ fontSize: 20 }}>
                {lastRelease?.current_version ? `v${lastRelease.current_version}` : "—"}
              </span>
              <span className="sub">
                {lastRelease
                  ? `${lastRelease.name} · ${relativeDate(lastRelease.last_release_date)}`
                  : "noch kein Release"}
              </span>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: "var(--app-fg-3)", font: "400 14px/1 var(--gs-font-mono)" }}>
            Projekte werden geladen…
          </div>
        ) : (
          <>
            <div className="section-hd">
              <h2>
                Alle Projekte
                <span>{projects.length}</span>
              </h2>
            </div>
            <div className="proj-grid">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
              {projects.length === 0 && (
                <div className="card" style={{ padding: "48px", textAlign: "center", color: "var(--app-fg-3)" }}>
                  <p>Noch keine Projekte angelegt.</p>
                  <Link href="/projects/new" className="btn" style={{ marginTop: 16, display: "inline-flex" }}>
                    + Erstes Projekt anlegen
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function ProjectCard({ project }: { project: ProjectSummary }) {
  const convention = project.naming_convention === "semver" ? "SemVer" : project.naming_convention === "date" ? "CalVer" : null;

  return (
    <Link href={`/projects/${project.id}`} className="proj-card">
      <div>
        <div className="proj-card__head">
          <h2>
            {project.name}
            {convention && (
              <span className={`chip chip--${project.naming_convention === "semver" ? "semver" : "calver"}`}>
                {convention}
              </span>
            )}
            {project.is_overdue && (
              <span className="chip chip--overdue">
                <span className="chip-dot" />
                Überfällig
              </span>
            )}
            {project.data_stale && (
              <span className="chip chip--stale">
                <span className="chip-dot" />
                Veraltet
              </span>
            )}
          </h2>
          <div className="proj-card__meta">
            <GitIcon />
            YouTrack + Azure DevOps
          </div>
        </div>

        <div className="proj-card__stats">
          <div className="stat">
            <span className="stat__label">Aktuelle Version</span>
            <span className="stat__val">
              <span className="ver">{project.current_version ? `v${project.current_version}` : "—"}</span>
            </span>
          </div>
          <div className="stat">
            <span className="stat__label">Letzter Release</span>
            <span className="stat__val" style={{ fontSize: 14 }}>
              {formatDate(project.last_release_date)}
              {project.last_release_date && (
                <span className="sub">· {relativeDate(project.last_release_date)}</span>
              )}
            </span>
          </div>
          <div className="stat">
            <span className="stat__label">Kadenz</span>
            <span className="stat__val" style={{ fontSize: 14 }}>
              Alle {project.release_cycle_days} Tage
            </span>
          </div>
          <div className="stat">
            <span className="stat__label">Tage seit Release</span>
            <span className="stat__val" style={{ fontSize: 14, color: project.is_overdue ? "var(--gs-error-fg)" : undefined }}>
              {project.days_since_release ?? "—"}
              {project.days_since_release != null && <span className="sub">Tage</span>}
            </span>
          </div>
        </div>
      </div>

      <div className="proj-card__side">
        <ReleaseSpark releases={project.last_release_date ? [{ release_date: project.last_release_date }] : []} />
        <span className="btn btn--ghost btn--sm">
          Öffnen
          <ChevRightIcon />
        </span>
      </div>
    </Link>
  );
}

function GitIcon() {
  return (
    <svg className="ico" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="18" r="3"/>
      <circle cx="6" cy="6" r="3"/>
      <path d="M6 21V9a9 9 0 0 0 9 9"/>
    </svg>
  );
}

function ChevRightIcon() {
  return (
    <svg className="ico" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
