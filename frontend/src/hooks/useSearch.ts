import { useCallback, useState } from "react";
import { api, ApiError } from "../api/client";
import { defaultFilters, SearchFilters, SearchResponse, SearchResultItem, SortDir, SortField, StatsResult } from "../types";

// Ao fazer uma busca "nova" (novo termo, filtro ou ordenação), buscamos de
// uma vez um lote grande o bastante para cobrir pelo menos as 3 primeiras
// páginas. Assim, navegar entre as páginas 1-3 fica instantâneo (sem nova
// requisição); só a partir da página 4 é que uma nova busca é disparada.
const BATCH_PAGES = 3;

const SORT_DEFAULT_DIR: Record<SortField, SortDir> = {
  score: "desc",
  title: "asc",
  readingTime: "asc",
  label: "asc",
  dtCreation: "desc",
};

interface BatchMeta {
  signature: string;
  pageSize: number;
  items: SearchResultItem[];
  totalHits: number;
  tookMillis: number;
  suggestions: string[] | null;
}

/** Assinatura dos filtros que "invalidam" o lote pré-carregado quando mudam (tudo, exceto a página). */
function signatureOf(f: SearchFilters): string {
  const { page, ...rest } = f;
  return JSON.stringify(rest);
}

function sliceFromBatch(meta: BatchMeta, page: number): SearchResponse {
  const start = (page - 1) * meta.pageSize;
  return {
    items: meta.items.slice(start, start + meta.pageSize),
    totalHits: meta.totalHits,
    totalPages: meta.totalHits === 0 ? 0 : Math.ceil(meta.totalHits / meta.pageSize),
    currentPage: page,
    pageSize: meta.pageSize,
    tookMillis: meta.tookMillis,
    suggestions: meta.suggestions,
  };
}

export function useSearch() {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters());
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [batch, setBatch] = useState<BatchMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const patchFilters = (patch: Partial<SearchFilters>) => setFilters((f) => ({ ...f, ...patch }));

  const runSearch = useCallback(
    async (page: number, overrides?: Partial<SearchFilters>) => {
      const nextFilters: SearchFilters = { ...filters, ...overrides, page };
      if (!nextFilters.text || nextFilters.text.trim() === "") {
        setError('Digite um termo de busca (equivalente ao parâmetro "query").');
        return;
      }
      setFilters(nextFilters);
      setHasSearched(true);
      setLoading(true);
      setError(null);
      const signature = signatureOf(nextFilters);

      try {
        if (page <= BATCH_PAGES) {
          let meta = batch;
          const batchStillValid = meta && meta.signature === signature && meta.pageSize === nextFilters.pageSize;
          if (!batchStillValid) {
            // Busca, de uma vez, itens suficientes para as 3 primeiras páginas.
            const fetched = await api.search({
              ...nextFilters,
              page: 1,
              pageSize: nextFilters.pageSize * BATCH_PAGES,
            });
            meta = {
              signature,
              pageSize: nextFilters.pageSize,
              items: fetched.items,
              totalHits: fetched.totalHits,
              tookMillis: fetched.tookMillis,
              suggestions: fetched.suggestions,
            };
            setBatch(meta);
          }
          setResponse(sliceFromBatch(meta as BatchMeta, page));
        } else {
          // Além da página 3, busca sob demanda (comportamento normal).
          const fetched = await api.search(nextFilters);
          setResponse({
            items: fetched.items,
            totalHits: fetched.totalHits,
            totalPages: fetched.totalHits === 0 ? 0 : Math.ceil(fetched.totalHits / nextFilters.pageSize),
            currentPage: page,
            pageSize: nextFilters.pageSize,
            tookMillis: fetched.tookMillis,
            suggestions: fetched.suggestions,
          });
        }
      } catch (err) {
        setResponse(null);
        setError(err instanceof ApiError ? err.message : "Erro ao buscar no Elasticsearch.");
      } finally {
        setLoading(false);
      }
    },
    [filters, batch]
  );

  /** Clique num cabeçalho de coluna: alterna asc/desc se já for a coluna ativa, senão usa a direção padrão da coluna. */
  const changeSort = useCallback(
    (field: SortField) => {
      const dir: SortDir =
        filters.sortField === field ? (filters.sortDir === "asc" ? "desc" : "asc") : SORT_DEFAULT_DIR[field];
      runSearch(1, { sortField: field, sortDir: dir });
    },
    [filters, runSearch]
  );

  const showStats = useCallback(async () => {
    if (!filters.text || filters.text.trim() === "") {
      setError("Digite um termo de busca antes de ver as estatísticas.");
      return;
    }
    try {
      setStats(await api.stats(filters));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao calcular estatísticas.");
    }
  }, [filters]);

  const clearFilters = useCallback(() => {
    setFilters((f) => ({ ...defaultFilters(), text: f.text, pageSize: f.pageSize }));
  }, []);

  return {
    filters,
    patchFilters,
    response,
    loading,
    error,
    stats,
    hasSearched,
    runSearch,
    changeSort,
    showStats,
    clearFilters,
    closeStats: () => setStats(null),
  };
}

export type UseSearchReturn = ReturnType<typeof useSearch>;
