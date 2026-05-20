import type {
  ApiError,
  ProjectCreate,
  ProjectSummary,
  ProjectUpdate,
  ReleasesResponse,
  ReleaseStats,
} from "@/types/api";

export interface UserCredentials {
  youtrack_base_url?: string;
  youtrack_token?: string;
  azuredevops_org_url?: string;
  azuredevops_pat?: string;
}

function buildHeaders(credentials: UserCredentials): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (credentials.youtrack_token) {
    headers["X-YouTrack-Token"] = credentials.youtrack_token;
  }
  if (credentials.youtrack_base_url) {
    headers["X-YouTrack-Url"] = credentials.youtrack_base_url;
  }
  if (credentials.azuredevops_pat) {
    headers["X-AzureDevOps-Pat"] = credentials.azuredevops_pat;
  }
  if (credentials.azuredevops_org_url) {
    headers["X-AzureDevOps-Url"] = credentials.azuredevops_org_url;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({
      type: "about:blank",
      title: "Request failed",
      status: res.status,
      detail: res.statusText,
    }));
    throw error;
  }
  return res.json() as Promise<T>;
}

export async function getProjects(
  credentials: UserCredentials
): Promise<ProjectSummary[]> {
  const res = await fetch("/api/projects", {
    headers: buildHeaders(credentials),
  });
  return handleResponse<ProjectSummary[]>(res);
}

export async function createProject(
  data: ProjectCreate,
  credentials: UserCredentials
): Promise<ProjectSummary> {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: buildHeaders(credentials),
    body: JSON.stringify(data),
  });
  return handleResponse<ProjectSummary>(res);
}

export async function updateProject(
  id: string,
  data: ProjectUpdate,
  credentials: UserCredentials
): Promise<ProjectSummary> {
  const res = await fetch(`/api/projects/${id}`, {
    method: "PUT",
    headers: buildHeaders(credentials),
    body: JSON.stringify(data),
  });
  return handleResponse<ProjectSummary>(res);
}

export async function deleteProject(
  id: string,
  credentials: UserCredentials
): Promise<void> {
  const res = await fetch(`/api/projects/${id}`, {
    method: "DELETE",
    headers: buildHeaders(credentials),
  });
  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({
      type: "about:blank",
      title: "Delete failed",
      status: res.status,
      detail: res.statusText,
    }));
    throw error;
  }
}

export async function getProjectReleases(
  id: string,
  credentials: UserCredentials,
  limit = 50,
  offset = 0
): Promise<ReleasesResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const res = await fetch(`/api/projects/${id}/releases?${params}`, {
    headers: buildHeaders(credentials),
  });
  return handleResponse<ReleasesResponse>(res);
}

export async function getStats(days = 90): Promise<ReleaseStats[]> {
  const res = await fetch(`/api/stats?days=${days}`);
  return handleResponse<ReleaseStats[]>(res);
}
