"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useUserSettings } from "@/context/UserSettingsContext";
import { getProjects } from "@/services/api";
import type { ProjectSummary } from "@/types/api";
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Edit Project</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          {loading ? (
            <p className="text-gray-400">Loading…</p>
          ) : project ? (
            <ProjectForm mode="edit" existing={project} />
          ) : (
            <p className="text-red-600">Project not found.</p>
          )}
        </div>
      </main>
    </div>
  );
}
