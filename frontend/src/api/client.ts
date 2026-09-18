import { ConnectionStatus, SearchFilters, SearchResponse, StatsResult } from "../types";

// Em dev, o Vite faz proxy de /api para o backend (vite.config.ts).
// Em produção, o nginx do container do frontend faz o mesmo proxy
// (frontend/nginx.conf) - por isso o caminho é sempre relativo.
const API_BASE = "/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;
  if (!response.ok) {
    const message = (data && (data as { message?: string }).message) || `Erro HTTP ${response.status}`;
    throw new ApiError(message, response.status);
  }
  return data as T;
}

export const api = {
  search(filters: SearchFilters): Promise<SearchResponse> {
    return request<SearchResponse>("/search", { method: "POST", body: JSON.stringify(filters) });
  },
  stats(filters: SearchFilters): Promise<StatsResult> {
    return request<StatsResult>("/search/stats", { method: "POST", body: JSON.stringify(filters) });
  },
  connectionStatus(): Promise<ConnectionStatus> {
    return request<ConnectionStatus>("/connection/status");
  },
  clusterHealth(): Promise<Record<string, unknown>[]> {
    return request<Record<string, unknown>[]>("/cluster/health");
  },
  clusterNodes(): Promise<Record<string, unknown>[]> {
    return request<Record<string, unknown>[]>("/cluster/nodes");
  },
  clusterIndices(): Promise<Record<string, unknown>[]> {
    return request<Record<string, unknown>[]>("/cluster/indices");
  },
};
