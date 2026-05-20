"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useUserSettings } from "@/context/UserSettingsContext";
import { getProjects } from "@/services/api";
import type { ProjectSummary } from "@/types/api";
import AppShell from "@/components/AppShell";
import ProjectForm from "@/components/ProjectForm";

export default function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { settings } = useUserSettings();
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjects(settings)
      .then((list) => setProject(list.find((p) => p.id === id) ?? null))
      .finally(() => setLoading(false));
  }, [id, settings]);

  return (
    <AppShell>
      <div className="topbar">
        <div className="topbar__crumbs">
          <Link href="/">Dashboard</Link>
          <span className="sep">/</span>
          {project && <><Link href={`/projects/${id}`}>{project.name}</Link><span className="sep">/</span></>}
          <span className="now">Bearbeiten</span>
        </div>
      </div>

      <div className="page">
        {loading ? (
          <div style={{ textAlign: "center", padding: "64px 0", color: "var(--app-fg-3)", font: "400 14px/1 var(--gs-font-mono)" }}>
            Projekt wird geladen…
          </div>
        ) : project ? (
          <div className="card" style={{ padding: "32px" }}>
            <ProjectForm mode="edit" existing={project} />
          </div>
        ) : (
          <div className="card" style={{ padding: "48px", textAlign: "center", color: "var(--app-fg-3)" }}>
            Projekt nicht gefunden. <Link href="/">Zurück zum Dashboard</Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
