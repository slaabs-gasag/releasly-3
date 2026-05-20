"use client";

import { useState } from "react";
import Link from "next/link";
import type { ProjectSummary } from "@/types/api";
import ProjectCard from "./ProjectCard";

interface Props {
  projects: ProjectSummary[];
}

export default function ProjectGrid({ projects: initial }: Props) {
  const [projects, setProjects] = useState(initial);

  function handleDeleted(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 mb-4">No projects yet.</p>
        <Link
          href="/projects/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Add Project
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} onDeleted={handleDeleted} />
      ))}
    </div>
  );
}
