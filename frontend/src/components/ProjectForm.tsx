"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserSettings } from "@/context/UserSettingsContext";
import { createProject, updateProject } from "@/services/api";
import type { ProjectCreate, ProjectSummary, NamingConvention, ReleaseSource } from "@/types/api";

interface Props {
  mode: "create" | "edit";
  existing?: ProjectSummary;
}

const DEFAULT_FORM: ProjectCreate = {
  name: "",
  source: "youtrack",
  youtrack_project_id: "",
  azuredevops_project: "",
  azuredevops_repository: "",
  naming_convention: "semver",
  release_cycle_days: 14,
};

export default function ProjectForm({ mode, existing }: Props) {
  const { settings } = useUserSettings();
  const router = useRouter();
  const [form, setForm] = useState<ProjectCreate>(
    existing
      ? {
          name: existing.name,
          source: existing.source,
          naming_convention: existing.naming_convention,
          release_cycle_days: existing.release_cycle_days,
          youtrack_project_id: "",
          azuredevops_project: "",
          azuredevops_repository: "",
        }
      : DEFAULT_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "release_cycle_days" ? Number(value) : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (
      form.source === "youtrack" &&
      !form.youtrack_project_id?.trim()
    ) {
      setError("YouTrack Project ID is required.");
      return;
    }
    if (
      form.source === "azuredevops" &&
      (!form.azuredevops_project?.trim() || !form.azuredevops_repository?.trim())
    ) {
      setError("Azure DevOps project and repository are required.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      if (mode === "create") {
        await createProject(form, settings);
        router.push("/");
      } else if (existing) {
        await updateProject(existing.id, form, settings);
        router.push("/");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Save failed";
      setError(message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Project Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={form.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
          Integration Source *
        </label>
        <select
          id="source"
          name="source"
          value={form.source}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="youtrack">YouTrack</option>
          <option value="azuredevops">Azure DevOps</option>
        </select>
      </div>

      {form.source === "youtrack" && (
        <div>
          <label htmlFor="youtrack_project_id" className="block text-sm font-medium text-gray-700 mb-1">
            YouTrack Project ID *
          </label>
          <input
            id="youtrack_project_id"
            name="youtrack_project_id"
            type="text"
            value={form.youtrack_project_id ?? ""}
            onChange={handleChange}
            placeholder="e.g. MYAPP"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {form.source === "azuredevops" && (
        <>
          <div>
            <label htmlFor="azuredevops_project" className="block text-sm font-medium text-gray-700 mb-1">
              Azure DevOps Project *
            </label>
            <input
              id="azuredevops_project"
              name="azuredevops_project"
              type="text"
              value={form.azuredevops_project ?? ""}
              onChange={handleChange}
              placeholder="e.g. MyProject"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="azuredevops_repository" className="block text-sm font-medium text-gray-700 mb-1">
              Repository *
            </label>
            <input
              id="azuredevops_repository"
              name="azuredevops_repository"
              type="text"
              value={form.azuredevops_repository ?? ""}
              onChange={handleChange}
              placeholder="e.g. my-repo"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      <div>
        <label htmlFor="naming_convention" className="block text-sm font-medium text-gray-700 mb-1">
          Naming Convention
        </label>
        <select
          id="naming_convention"
          name="naming_convention"
          value={form.naming_convention}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="semver">Semantic (1.2.3)</option>
          <option value="date">Date (YYYYMMDD.N)</option>
          <option value="unknown">Unknown / Custom</option>
        </select>
      </div>

      <div>
        <label htmlFor="release_cycle_days" className="block text-sm font-medium text-gray-700 mb-1">
          Release Cycle (days)
        </label>
        <input
          id="release_cycle_days"
          name="release_cycle_days"
          type="number"
          min={1}
          value={form.release_cycle_days}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : mode === "create" ? "Add Project" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
