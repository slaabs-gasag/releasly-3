"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserSettings, type UserSettings } from "@/context/UserSettingsContext";

export default function CredentialSetupForm() {
  const { settings, saveSettings } = useUserSettings();
  const router = useRouter();
  const [form, setForm] = useState<UserSettings>(settings);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const hasYoutrack = form.youtrack_base_url && form.youtrack_token;
    const hasDevops = form.azuredevops_org_url && form.azuredevops_pat;
    if (!hasYoutrack && !hasDevops) {
      setError(
        "Enter at least one complete integration (YouTrack or Azure DevOps)."
      );
      return;
    }
    setError("");
    saveSettings(form);
    router.push("/");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div style={{ padding: "12px 16px", background: "var(--gs-error-bg)", color: "var(--gs-error-fg)", border: "1px solid var(--gs-error-border)", marginBottom: 16, font: "400 14px/1.5 var(--gs-font-sans)" }}>
          {error}
        </div>
      )}

      <fieldset className="space-y-4">
        <legend style={{ font: "700 16px/1.2 var(--gs-font-sans)", color: "var(--app-fg-1)", marginBottom: 12, display: "block" }}>YouTrack</legend>
        <div>
          <label htmlFor="youtrack_base_url" style={{ display: "block", font: "600 11px/1 var(--gs-font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--app-fg-3)", marginBottom: 6 }}>
            Base URL
          </label>
          <input
            id="youtrack_base_url"
            name="youtrack_base_url"
            type="url"
            value={form.youtrack_base_url}
            onChange={handleChange}
            placeholder="https://youtrack.example.com"
            className="w-full px-3 py-2 border border-solid" style={{ borderColor: "var(--app-border-mid)", borderRadius: "2px", font: "400 14px/1.5 var(--gs-font-sans)", outline: "none", background: "var(--app-canvas)", color: "var(--app-fg-1)" }}
          />
        </div>
        <div>
          <label htmlFor="youtrack_token" style={{ display: "block", font: "600 11px/1 var(--gs-font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--app-fg-3)", marginBottom: 6 }}>
            Bearer Token
          </label>
          <input
            id="youtrack_token"
            name="youtrack_token"
            type="password"
            value={form.youtrack_token}
            onChange={handleChange}
            placeholder="perm:..."
            className="w-full px-3 py-2 border border-solid" style={{ borderColor: "var(--app-border-mid)", borderRadius: "2px", font: "400 14px/1.5 var(--gs-font-sans)", outline: "none", background: "var(--app-canvas)", color: "var(--app-fg-1)" }}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend style={{ font: "700 16px/1.2 var(--gs-font-sans)", color: "var(--app-fg-1)", marginBottom: 12, display: "block" }}>Azure DevOps</legend>
        <div>
          <label htmlFor="azuredevops_org_url" style={{ display: "block", font: "600 11px/1 var(--gs-font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--app-fg-3)", marginBottom: 6 }}>
            Organization URL
          </label>
          <input
            id="azuredevops_org_url"
            name="azuredevops_org_url"
            type="url"
            value={form.azuredevops_org_url}
            onChange={handleChange}
            placeholder="https://dev.azure.com/my-org"
            className="w-full px-3 py-2 border border-solid" style={{ borderColor: "var(--app-border-mid)", borderRadius: "2px", font: "400 14px/1.5 var(--gs-font-sans)", outline: "none", background: "var(--app-canvas)", color: "var(--app-fg-1)" }}
          />
        </div>
        <div>
          <label htmlFor="azuredevops_pat" style={{ display: "block", font: "600 11px/1 var(--gs-font-mono)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--app-fg-3)", marginBottom: 6 }}>
            Personal Access Token
          </label>
          <input
            id="azuredevops_pat"
            name="azuredevops_pat"
            type="password"
            value={form.azuredevops_pat}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-solid" style={{ borderColor: "var(--app-border-mid)", borderRadius: "2px", font: "400 14px/1.5 var(--gs-font-sans)", outline: "none", background: "var(--app-canvas)", color: "var(--app-fg-1)" }}
          />
        </div>
      </fieldset>

      <button
        type="submit"
        className="btn"
        style={{ width: "100%", justifyContent: "center" }}
      >
        Save and continue
      </button>
    </form>
  );
}
