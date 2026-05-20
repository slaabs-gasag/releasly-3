"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProjectSummary } from "@/types/api";
import OverdueIndicator from "./OverdueIndicator";
import StaleIndicator from "./StaleIndicator";
import { deleteProject } from "@/services/api";
import { useUserSettings } from "@/context/UserSettingsContext";

interface Props {
  project: ProjectSummary;
  onDeleted?: (id: string) => void;
}

const SOURCE_LABELS: Record<string, string> = {
  youtrack: "YouTrack",
  azuredevops: "Azure DevOps",
};

export default function ProjectCard({ project, onDeleted }: Props) {
  const { settings } = useUserSettings();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm(`Delete project "${project.name}"?`)) return;
    setDeleting(true);
    try {
      await deleteProject(project.id, settings);
      onDeleted?.(project.id);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <Link
      href={`/projects/${project.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-600">
            {project.name}
          </h2>
          <span className="text-xs text-gray-400">{SOURCE_LABELS[project.source] ?? project.source}</span>
        </div>
        <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.preventDefault()}>
          <Link
            href={`/projects/${project.id}/edit`}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 rounded text-red-600 disabled:opacity-50"
          >
            {deleting ? "…" : "Delete"}
          </button>
        </div>
      </div>

      <div className="mb-3">
        <span className="text-2xl font-mono font-bold text-gray-800">
          {project.current_version ?? "—"}
        </span>
        {project.last_release_date && (
          <span className="ml-2 text-xs text-gray-400">
            {new Date(project.last_release_date).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {project.is_overdue && (
          <OverdueIndicator daysOverdue={project.days_since_release ?? undefined} />
        )}
        {project.data_stale && (
          <StaleIndicator fetchedAt={project.data_fetched_at} />
        )}
      </div>
    </Link>
  );
}
