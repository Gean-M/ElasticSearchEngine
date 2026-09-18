import { useEffect, useState } from "react";
import { api } from "./api/client";
import { ConnectionStatus } from "./types";
import { ConnectionStatusBar } from "./components/ConnectionStatusBar";
import { SearchHeaderBar } from "./components/SearchHeaderBar";
import { SearchResultsArea } from "./pages/SearchResultsArea";
import { ClusterPage } from "./pages/ClusterPage";
import { useSearch } from "./hooks/useSearch";

type Tab = "busca" | "cluster";

export default function App() {
  const [tab, setTab] = useState<Tab>("busca");
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const search = useSearch();

  useEffect(() => {
    let cancelled = false;
    api
      .connectionStatus()
      .then((s) => !cancelled && setStatus(s))
      .catch(() => !cancelled && setStatus(null));
    return () => {
      cancelled = true;
    };
  }, []);

  // Antes da primeira busca, o cabeçalho é maior/mais espaçado (efeito de
  // "landing"); depois, ele encolhe e a busca fica compacta ao lado do
  // título - tudo com transições suaves (ver classes "transition-all").
  const compact = search.hasSearched;

  return (
    <div className="flex h-screen flex-col bg-paper">
      <header className="border-b border-hairline">
        <div
          className={`flex items-center justify-between gap-6 px-6 transition-all duration-500 ease-in-out ${
            compact ? "py-3" : "py-12"
          }`}
        >
          <div className="shrink-0">
            <h1
              className={`font-serif font-semibold text-ink transition-all duration-500 ease-in-out ${
                compact ? "text-xl" : "text-3xl"
              }`}
            >
              ElasticSearch Engine
            </h1>
            <p className="text-xs text-ink-soft">Uma interface web para o ElasticSearch</p>
          </div>

          {tab === "busca" && (
            <div className="flex-1">
              <SearchHeaderBar search={search} compact={compact} />
            </div>
          )}

          <nav className="flex shrink-0 gap-1 text-sm">
            {(["busca", "cluster"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded px-4 py-2 transition ${
                  tab === t ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-dim"
                }`}
              >
                {t === "busca" ? "Busca" : "Cluster"}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {tab === "busca" ? <SearchResultsArea search={search} /> : <ClusterPage />}

      <ConnectionStatusBar status={status} />
    </div>
  );
}
