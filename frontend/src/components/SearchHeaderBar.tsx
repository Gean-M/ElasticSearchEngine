import { useEffect, useRef, useState } from "react";
import { UseSearchReturn } from "../hooks/useSearch";
import { FilterDropdown } from "./FilterDropdown";

interface Props {
  search: UseSearchReturn;
  compact: boolean;
}

export function SearchHeaderBar({ search, compact }: Props) {
  const { filters, patchFilters, runSearch, loading, clearFilters } = search;
  const [filterOpen, setFilterOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState("0px");

  // Mede a altura real do conteúdo para animar um "desenrolar" suave e
  // preciso (em vez de um max-height fixo arbitrário).
  useEffect(() => {
    if (!contentRef.current) return;
    setMaxHeight(filterOpen ? `${contentRef.current.scrollHeight}px` : "0px");
  }, [filterOpen, filters]);

  return (
    <div>
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(1);
        }}
      >
        <input
          type="text"
          value={filters.text}
          onChange={(e) => patchFilters({ text: e.target.value })}
          placeholder='Buscar em "content"...'
          className={`min-w-[160px] flex-1 rounded border border-hairline bg-white text-ink placeholder:text-ink-soft/60 transition-all duration-500 ease-in-out focus:border-amber-dark ${
            compact ? "px-3 py-2 text-sm" : "px-4 py-3 text-base"
          }`}
        />
        <button
          type="submit"
          disabled={loading}
          className={`shrink-0 rounded bg-ink font-medium text-paper transition-all duration-500 ease-in-out hover:bg-ink/90 disabled:opacity-50 ${
            compact ? "px-4 py-2 text-sm" : "px-5 py-3 text-sm"
          }`}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
        <button
          type="button"
          onClick={() => setFilterOpen((v) => !v)}
          aria-expanded={filterOpen}
          className={`flex shrink-0 items-center gap-1.5 rounded font-medium transition-all duration-300 ease-in-out ${
            compact ? "px-4 py-2 text-sm" : "px-5 py-3 text-sm"
          } ${
            filterOpen
              ? "bg-amber text-ink"
              : "border border-hairline text-ink-soft hover:bg-paper-dim"
          }`}
        >
          Filtrar
          <svg
            viewBox="0 0 10 6"
            fill="none"
            className={`h-2.5 w-2.5 transition-transform duration-300 ease-in-out ${
              filterOpen ? "rotate-180" : "rotate-0"
            }`}
          >
            <path
              d="M1 1L5 5L9 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>

      <div
        style={{ maxHeight, opacity: filterOpen ? 1 : 0 }}
        className="overflow-hidden transition-all duration-300 ease-in-out"
      >
        <div ref={contentRef} className="pt-4">
          <FilterDropdown
            filters={filters}
            onChange={patchFilters}
            onApply={() => runSearch(1)}
            onClear={clearFilters}
          />
        </div>
      </div>
    </div>
  );
}
