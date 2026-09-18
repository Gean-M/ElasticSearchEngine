import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";

type Row = Record<string, unknown>;

const NODE_COLUMNS: [string, string][] = [
  ["name", "Nome"],
  ["ip", "IP"],
  ["node.role", "Papel"],
  ["master", "Master"],
  ["heap.percent", "Heap %"],
  ["ram.percent", "RAM %"],
  ["cpu", "CPU %"],
];

const INDEX_COLUMNS: [string, string][] = [
  ["health", "Saúde"],
  ["status", "Status"],
  ["index", "Índice"],
  ["pri", "Shards Pri."],
  ["rep", "Réplicas"],
  ["docs.count", "Documentos"],
  ["store.size", "Tamanho"],
];

function statusColor(status: unknown) {
  switch (String(status).toLowerCase()) {
    case "green":
      return "text-signal-green";
    case "yellow":
      return "text-signal-yellow";
    case "red":
      return "text-signal-red";
    default:
      return "text-ink-soft";
  }
}

function DataTable({ columns, rows }: { columns: [string, string][]; rows: Row[] }) {
  return (
    <div className="overflow-auto rounded border border-hairline">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-paper-dim text-left text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            {columns.map(([key, label]) => (
              <th key={key} className="border-b border-hairline px-3 py-2 font-medium">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b border-hairline/70">
              {columns.map(([key]) => (
                <td key={key} className="px-3 py-1.5 font-mono text-ink">
                  {String(row[key] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-ink-soft">
                Sem dados. Clique em &ldquo;Atualizar&rdquo;.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ClusterPage() {
  const [health, setHealth] = useState<Row | null>(null);
  const [nodes, setNodes] = useState<Row[]>([]);
  const [indices, setIndices] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"nodes" | "indices">("nodes");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthList, nodeRows, indexRows] = await Promise.all([
        api.clusterHealth(),
        api.clusterNodes(),
        api.clusterIndices(),
      ]);
      setHealth(healthList[0] ?? null);
      setNodes(nodeRows);
      setIndices(indexRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao consultar o cluster.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          onClick={refresh}
          disabled={loading}
          className="rounded bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink/90 disabled:opacity-50"
        >
          {loading ? "Consultando..." : "Atualizar"}
        </button>
        {health && (
          <span className="flex items-center gap-2 text-sm">
            <span className={`text-lg leading-none ${statusColor(health.status)}`}>●</span>
            Cluster &ldquo;{String(health.cluster)}&rdquo; · status: {String(health.status)} · nós:{" "}
            {String(health["node.total"])} · shards ativos: {String(health.active_shards)} · não atribuídos:{" "}
            {String(health.unassign ?? health.unassigned_shards ?? "-")}
          </span>
        )}
        {error && <span className="text-sm text-signal-red">{error}</span>}
      </div>

      <div className="mb-3 flex gap-1 border-b border-hairline text-sm">
        {(["nodes", "indices"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 ${
              tab === t ? "border-b-2 border-amber-dark font-medium text-ink" : "text-ink-soft"
            }`}
          >
            {t === "nodes" ? "Nós do cluster" : "Índices"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {tab === "nodes" ? (
          <DataTable columns={NODE_COLUMNS} rows={nodes} />
        ) : (
          <DataTable columns={INDEX_COLUMNS} rows={indices} />
        )}
      </div>
    </div>
  );
}
