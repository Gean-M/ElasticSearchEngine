import { UseSearchReturn } from "../hooks/useSearch";
import { SuggestionBar } from "../components/SuggestionBar";
import { ResultsPanel } from "../components/ResultsPanel";
import { PaginationBar } from "../components/PaginationBar";
import { StatsModal } from "../components/StatsModal";

interface Props {
  search: UseSearchReturn;
}

export function SearchResultsArea({ search }: Props) {
  const { response, loading, error, filters, runSearch, changeSort, showStats, stats, closeStats } = search;

  return (
    <div className="flex flex-1 flex-col overflow-hidden px-8 py-4">
      {error && (
        <div className="mb-4 rounded border border-signal-red/40 bg-signal-red/10 px-4 py-2 text-sm text-signal-red">
          {error}
        </div>
      )}

      {response && response.totalHits === 0 && response.suggestions && response.suggestions.length > 0 && (
        <SuggestionBar suggestion={response.suggestions[0]} onUseSuggestion={(text) => runSearch(1, { text })} />
      )}

      <ResultsPanel
        items={response?.items ?? []}
        sortField={filters.sortField}
        sortDir={filters.sortDir}
        onSort={changeSort}
      />

      <PaginationBar
        response={response}
        loading={loading}
        pageSize={filters.pageSize}
        onGoToPage={(page) => runSearch(page)}
        onPageSizeChange={(size) => runSearch(1, { pageSize: size })}
        onShowStats={showStats}
      />

      <StatsModal stats={stats} onClose={closeStats} />
    </div>
  );
}
