// Espelha, em TypeScript, os models do projeto Swing original
// (com.elasticgui.model.*), para manter o mesmo contrato de dados
// entre backend e frontend.

export type Operator = "OR" | "AND";

export type SortField = "score" | "title" | "readingTime" | "label" | "dtCreation";
export type SortDir = "asc" | "desc";

/** Equivalente a SearchFilters.java */
export interface SearchFilters {
  text: string;
  page: number;
  pageSize: number;
  operator: Operator;
  phraseBoost: boolean;
  fuzziness: string | null; // null | "AUTO" | "0" | "1" | "2"
  highlight: boolean;
  sortField: SortField;
  sortDir: SortDir;
  readingTimeMin: number | null;
  readingTimeMax: number | null;
  dateFrom: string | null; // yyyy-MM-dd
  dateTo: string | null; // yyyy-MM-dd
  labels: string[]; // "rápido" | "médio" | "demorado"
}

/** Equivalente a SearchResultItem.java */
export interface SearchResultItem {
  title: string | null;
  url: string | null;
  abstractText: string | null;
  highlightHtml: string | null;
  readingTime: number | null;
  dtCreation: string | null;
  label: string | null;
  score: number | null;
}

/** Equivalente a SearchResponse.java */
export interface SearchResponse {
  items: SearchResultItem[];
  totalHits: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  tookMillis: number;
  suggestions: string[] | null;
}

/** Equivalente a StatsResult.java */
export interface StatsResult {
  count: number;
  min: number | null;
  max: number | null;
  avg: number | null;
  sum: number | null;
}

/** Equivalente a AppConfig.java (sem persistência em arquivo; vem de variáveis de ambiente) */
export interface AppConfig {
  scheme: "http" | "https";
  host: string;
  port: number;
  username: string;
  password: string;
  indexName: string;
  trustAllCerts: boolean;
}

export function defaultFilters(): SearchFilters {
  return {
    text: "",
    page: 1,
    pageSize: 10,
    operator: "OR",
    phraseBoost: false,
    fuzziness: null,
    highlight: true,
    sortField: "score",
    sortDir: "desc",
    readingTimeMin: null,
    readingTimeMax: null,
    dateFrom: null,
    dateTo: null,
    labels: [],
  };
}
