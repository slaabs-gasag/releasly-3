"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { ProjectSummary } from "@/types/api";

interface Props {
  projects: ProjectSummary[];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default function Sidebar({ projects }: Props) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isDashboard = pathname === "/";
  const activeProjectId = pathname.startsWith("/projects/")
    ? pathname.split("/")[2]
    : null;

  const userName = session?.user?.name ?? "Benutzer";
  const userEmail = session?.user?.email ?? "";

  return (
    <aside className="sb">
      <div className="sb__brand">
        <div className="sb__logo" aria-label="GASAG" />
        <div className="sb__product">Releasly</div>
      </div>

      <div className="sb__section-title">Übersicht</div>
      <nav className="sb__nav">
        <Link
          href="/"
          className={"sb__item" + (isDashboard ? " is-active" : "")}
        >
          <DashIcon />
          <div className="sb__proj-name"><b>Dashboard</b></div>
          <span />
        </Link>
      </nav>

      <div className="sb__section-title">Projekte</div>
      <nav className="sb__nav">
        {projects.map((p) => {
          const active = activeProjectId === p.id;
          const badge = p.is_overdue ? "!" : "";
          return (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className={"sb__item" + (active ? " is-active" : "")}
            >
              <BoxIcon />
              <div className="sb__proj-name">
                <b>{p.name}</b>
                <span>
                  {p.source === "youtrack" ? "YouTrack" : "Azure DevOps"}
                  {p.current_version ? ` · v${p.current_version}` : ""}
                </span>
              </div>
              {badge && <span className="sb__count">{badge}</span>}
            </Link>
          );
        })}
        <Link href="/projects/new" className="sb__item" style={{ opacity: 0.7 }}>
          <PlusIcon />
          <div className="sb__proj-name"><b>Projekt hinzufügen</b></div>
          <span />
        </Link>
      </nav>

      <div className="sb__foot">
        <div className="sb__avatar">{initials(userName)}</div>
        <div>
          <b>{userName}</b>
          <span>{userEmail}</span>
        </div>
      </div>
    </aside>
  );
}

function DashIcon() {
  return (
    <svg className="ico" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9"/>
      <rect x="14" y="3" width="7" height="5"/>
      <rect x="14" y="12" width="7" height="9"/>
      <rect x="3" y="16" width="7" height="5"/>
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg className="ico" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="ico" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
