"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserSettings } from "@/context/UserSettingsContext";
import { createProject, updateProject } from "@/services/api";
import type { ProjectCreate, ProjectSummary, NamingConvention } from "@/types/api";

interface Props {
  mode: "create" | "edit";
  existing?: ProjectSummary;
}

const DEFAULT_FORM: ProjectCreate = {
  name: "",
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
          youtrack_project_id: existing.youtrack_project_id ?? "",
          azuredevops_project: existing.azuredevops_project ?? "",
          azuredevops_repository: existing.azuredevops_repository ?? "",
          naming_convention: existing.naming_convention,
          release_cycle_days: existing.release_cycle_days,
        }
      : DEFAULT_FORM
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectCreate, string>>>({});

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "release_cycle_days" ? Number(value) : value,
    }));
    if (errors[name as keyof ProjectCreate]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Partial<Record<keyof ProjectCreate, string>> = {};

    if (!form.name.trim()) newErrors.name = "Projektname ist erforderlich.";
    if (!form.youtrack_project_id.trim()) newErrors.youtrack_project_id = "YouTrack-Projekt-ID ist erforderlich.";
    if (!form.azuredevops_project.trim()) newErrors.azuredevops_project = "Azure DevOps-Projekt ist erforderlich.";
    if (!form.azuredevops_repository.trim()) newErrors.azuredevops_repository = "Azure DevOps-Repository ist erforderlich.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
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
      const message = err instanceof Error ? err.message : "Speichern fehlgeschlagen";
      setErrors({ name: message });
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="kv" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <label htmlFor="name" style={{ display: "block", font: "600 13px/1 var(--gs-font-sans)", color: "var(--app-fg-2)", marginBottom: 6 }}>
          Projektname *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          className={errors.name ? "input input--error" : "input"}
          style={{ width: "100%" }}
        />
        {errors.name && <span style={{ font: "400 12px/1 var(--gs-font-sans)", color: "var(--gs-error-fg)", marginTop: 4, display: "block" }}>{errors.name}</span>}
      </div>

      <div style={{ borderTop: "1px solid var(--app-border)", paddingTop: 16 }}>
        <p style={{ font: "600 13px/1 var(--gs-font-sans)", color: "var(--app-fg-2)", marginBottom: 16 }}>
          Integrationen — beide Felder sind Pflicht
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label htmlFor="youtrack_project_id" style={{ display: "block", font: "600 13px/1 var(--gs-font-sans)", color: "var(--app-fg-2)", marginBottom: 6 }}>
              YouTrack-Projekt-ID *
            </label>
            <input
              id="youtrack_project_id"
              name="youtrack_project_id"
              type="text"
              value={form.youtrack_project_id}
              onChange={handleChange}
              placeholder="z.B. MYAPP"
              className={errors.youtrack_project_id ? "input input--error" : "input"}
              style={{ width: "100%" }}
            />
            {errors.youtrack_project_id && <span style={{ font: "400 12px/1 var(--gs-font-sans)", color: "var(--gs-error-fg)", marginTop: 4, display: "block" }}>{errors.youtrack_project_id}</span>}
          </div>

          <div>
            <label htmlFor="azuredevops_project" style={{ display: "block", font: "600 13px/1 var(--gs-font-sans)", color: "var(--app-fg-2)", marginBottom: 6 }}>
              Azure DevOps-Projekt *
            </label>
            <input
              id="azuredevops_project"
              name="azuredevops_project"
              type="text"
              value={form.azuredevops_project}
              onChange={handleChange}
              placeholder="z.B. MeinProjekt"
              className={errors.azuredevops_project ? "input input--error" : "input"}
              style={{ width: "100%" }}
            />
            {errors.azuredevops_project && <span style={{ font: "400 12px/1 var(--gs-font-sans)", color: "var(--gs-error-fg)", marginTop: 4, display: "block" }}>{errors.azuredevops_project}</span>}
          </div>

          <div>
            <label htmlFor="azuredevops_repository" style={{ display: "block", font: "600 13px/1 var(--gs-font-sans)", color: "var(--app-fg-2)", marginBottom: 6 }}>
              Azure DevOps-Repository *
            </label>
            <input
              id="azuredevops_repository"
              name="azuredevops_repository"
              type="text"
              value={form.azuredevops_repository}
              onChange={handleChange}
              placeholder="z.B. mein-repo"
              className={errors.azuredevops_repository ? "input input--error" : "input"}
              style={{ width: "100%" }}
            />
            {errors.azuredevops_repository && <span style={{ font: "400 12px/1 var(--gs-font-sans)", color: "var(--gs-error-fg)", marginTop: 4, display: "block" }}>{errors.azuredevops_repository}</span>}
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--app-border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label htmlFor="naming_convention" style={{ display: "block", font: "600 13px/1 var(--gs-font-sans)", color: "var(--app-fg-2)", marginBottom: 6 }}>
            Versionsschema
          </label>
          <select
            id="naming_convention"
            name="naming_convention"
            value={form.naming_convention}
            onChange={handleChange}
            className="input"
            style={{ width: "100%" }}
          >
            <option value="semver">SemVer (1.2.3)</option>
            <option value="date">CalVer (JJJJ.MM.N)</option>
            <option value="unknown">Unbekannt / Benutzerdefiniert</option>
          </select>
        </div>

        <div>
          <label htmlFor="release_cycle_days" style={{ display: "block", font: "600 13px/1 var(--gs-font-sans)", color: "var(--app-fg-2)", marginBottom: 6 }}>
            Release-Kadenz (Tage)
          </label>
          <input
            id="release_cycle_days"
            name="release_cycle_days"
            type="number"
            min={1}
            value={form.release_cycle_days}
            onChange={handleChange}
            className="input"
            style={{ width: "100%" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, paddingTop: 8 }}>
        <button
          type="submit"
          disabled={saving}
          className="btn"
          style={{ flex: 1 }}
        >
          {saving ? "Wird gespeichert…" : mode === "create" ? "Projekt anlegen" : "Speichern"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn--ghost"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
