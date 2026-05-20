"use client";

import { useEffect, useState } from "react";
import { useUserSettings } from "@/context/UserSettingsContext";
import { getProjects } from "@/services/api";
import Sidebar from "./Sidebar";
import type { ProjectSummary } from "@/types/api";

interface Props {
  children: React.ReactNode;
}

export default function AppShell({ children }: Props) {
  const { settings } = useUserSettings();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);

  useEffect(() => {
    getProjects(settings).then(setProjects).catch(() => {});
  }, [settings]);

  return (
    <div className="app">
      <Sidebar projects={projects} />
      <main className="main">{children}</main>
    </div>
  );
}
