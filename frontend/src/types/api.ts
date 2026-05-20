export type NamingConvention = "semver" | "date" | "unknown";

export interface ProjectSummary {
  id: string;
  slug: string;
  name: string;
  youtrack_project_id: string;
  azuredevops_project: string;
  azuredevops_repository: string;
  naming_convention: NamingConvention;
  release_cycle_days: number;
  current_version: string | null;
  last_release_date: string | null;
  is_overdue: boolean;
  days_since_release: number | null;
  data_stale: boolean;
  data_fetched_at: string | null;
}

export interface Release {
  version: string;
  release_date: string | null;
  release_notes: string | null;
  naming_convention: NamingConvention;
  is_convention_match: boolean;
  source: "live" | "cache";
}

export interface ReleasesResponse {
  releases: Release[];
  project_id: string;
  source: "live" | "cache";
}

export interface ReleaseStats {
  project_id: string;
  project_name: string;
  releases_per_week: number;
  average_cycle_days: number;
  configured_cycle_days: number;
  on_track: boolean;
  weekly_counts: { week: string; count: number }[];
}

export interface ProjectCreate {
  name: string;
  youtrack_project_id: string;
  azuredevops_project: string;
  azuredevops_repository: string;
  naming_convention: NamingConvention;
  release_cycle_days: number;
}

export interface ProjectUpdate extends Partial<ProjectCreate> {}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
}
