import { useState } from "react";
import { SearchResponse } from "../types";

interface Props {
  response: SearchResponse | null;
  loading: boolean;
  onGoToPage: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onShowStats: () => void;
  pageSize: number;
}

export function PaginationBar({ response, loading, onGoToPage, onPageSizeChange, onShowStats, pageSize }: Props) {
  const [goTo, setGoTo] = useState("");

  const currentPage = response?.currentPage ?? 0;
  const totalPages = response?.totalPages ?? 0;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3 text-sm">
      <span className="text-ink-soft">
        {response
          ? `${response.totalHits} resultado(s) encontrados em ${response.tookMillis} ms.`
          : "Aguardando busca..."}
      </span>

      <div className="flex flex-wrap items-center gap-2">
        <button
          disabled={loading || currentPage <= 1}
          onClick={() => onGoToPage(currentPage - 1)}
          className="rounded border border-hairline px-2 py-1 text-ink disabled:opacity-40"
        >
          ◀ Anterior
        </button>
        <span className="px-2 font-mono text-ink-soft">
          Página {totalPages === 0 ? 0 : currentPage} de {totalPages}
        </span>
        <button
          disabled={loading || currentPage >= totalPages}
          onClick={() => onGoToPage(currentPage + 1)}
          className="rounded border border-hairline px-2 py-1 text-ink disabled:opacity-40"
        >
          Próxima ▶
        </button>

        <span className="ml-3 text-ink-soft">Ir para página:</span>
        <input
          type="number"
          min={1}
          value={goTo}
          onChange={(e) => setGoTo(e.target.value)}
          className="w-14 rounded border border-hairline bg-white px-2 py-1"
        />
        <button
          onClick={() => {
            const page = Number(goTo);
            if (page > 0) onGoToPage(page);
          }}
          className="rounded border border-hairline px-2 py-1 text-ink"
        >
          Ir
        </button>

        <span className="ml-3 text-ink-soft">Resultados por página:</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded border border-hairline bg-white px-2 py-1"
        >
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <button
          onClick={onShowStats}
          className="ml-3 rounded bg-ink px-3 py-1.5 text-paper transition hover:bg-ink/90"
        >
          Ver estatísticas do conjunto
        </button>
      </div>
    </div>
  );
}
