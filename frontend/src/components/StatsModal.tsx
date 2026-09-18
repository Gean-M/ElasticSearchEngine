import { StatsResult } from "../types";

interface Props {
  stats: StatsResult | null;
  onClose: () => void;
}

function fmt(value: number | null): string {
  return value === null ? "-" : value.toFixed(2);
}

export function StatsModal({ stats, onClose }: Props) {
  if (!stats) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-sm rounded border border-hairline bg-paper p-5 shadow-lg">
        <h2 className="font-serif text-lg text-ink">Estatísticas (aggregation &ldquo;stats&rdquo;)</h2>
        <p className="mt-1 text-xs text-ink-soft">Campo &ldquo;reading_time&rdquo; do conjunto filtrado</p>

        <dl className="mt-4 grid grid-cols-2 gap-y-2 font-mono text-sm">
          <dt className="text-ink-soft">Documentos</dt>
          <dd className="text-right">{stats.count}</dd>
          <dt className="text-ink-soft">Mínimo</dt>
          <dd className="text-right">{fmt(stats.min)}</dd>
          <dt className="text-ink-soft">Máximo</dt>
          <dd className="text-right">{fmt(stats.max)}</dd>
          <dt className="text-ink-soft">Média</dt>
          <dd className="text-right">{fmt(stats.avg)}</dd>
          <dt className="text-ink-soft">Soma</dt>
          <dd className="text-right">{fmt(stats.sum)}</dd>
        </dl>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded bg-ink py-2 text-sm font-medium text-paper transition hover:bg-ink/90"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
