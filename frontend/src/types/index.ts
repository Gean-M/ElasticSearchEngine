export type Operator = "OR" | "AND";

export type SortField = "score" | "title" | "readingTime" | "label" | "dtCreation";
export type SortDir = "asc" | "desc";

export interface SearchFilters {
  text: string;
  page: number;
  pageSize: number;
  operator: Operator;
  phraseBoost: boolean;
  fuzziness: string | null;
  highlight: boolean;
  sortField: SortField;
  sortDir: SortDir;
  readingTimeMin: number | null;
  readingTimeMax: number | null;
  dateFrom: string | null;
  dateTo: string | null;
  labels: string[];
}

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

export interface SearchResponse {
  items: SearchResultItem[];
  totalHits: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  tookMillis: number;
  suggestions: string[] | null;
}

export interface StatsResult {
  count: number;
  min: number | null;
  max: number | null;
  avg: number | null;
  sum: number | null;
}

export interface ConnectionStatus {
  connected: boolean;
  baseUrl: string;
  indexName: string;
  username: string;
  clusterName?: string | null;
  versionNumber?: string | null;
  error?: string;
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
