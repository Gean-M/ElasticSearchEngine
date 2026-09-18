import { SearchFilters } from "../types";

interface Props {
  filters: SearchFilters;
  onChange: (patch: Partial<SearchFilters>) => void;
  onApply: () => void;
  onClear: () => void;
}

const FUZZINESS_OPTIONS = [
  { value: "", label: "Desativado" },
  { value: "AUTO", label: "AUTO" },
  { value: "0", label: "0" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
];

const LABEL_OPTIONS = [
  { value: "rápido", text: "rápido (≤ 5 min)" },
  { value: "médio", text: "médio (6-10 min)" },
  { value: "demorado", text: "demorado (11-15 min)" },
];

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-medium tracking-wide text-ink-soft">{title}</h3>
      {children}
    </div>
  );
}

export function FilterDropdown({ filters, onChange, onApply, onClear }: Props) {
  const toggleLabel = (value: string) => {
    const has = filters.labels.includes(value);
    onChange({ labels: has ? filters.labels.filter((l) => l !== value) : [...filters.labels, value] });
  };

  return (
    <div className="rounded border border-hairline bg-paper-dim/50 p-5">
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-4">
          <FieldGroup title="Operador">
            <select
              value={filters.operator}
              onChange={(e) => onChange({ operator: e.target.value as SearchFilters["operator"] })}
              className="w-full rounded border border-hairline bg-white px-2 py-1.5 text-sm"
            >
              <option value="OR">OU entre os termos (padrão)</option>
              <option value="AND">E entre todos os termos</option>
            </select>
          </FieldGroup>

          <FieldGroup title="Fuzziness">
            <select
              value={filters.fuzziness ?? ""}
              onChange={(e) => onChange({ fuzziness: e.target.value || null })}
              className="w-full rounded border border-hairline bg-white px-2 py-1.5 text-sm"
            >
              {FUZZINESS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FieldGroup>
        </div>

        <div className="flex flex-col gap-3 justify-center">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={filters.phraseBoost}
              onChange={(e) => onChange({ phraseBoost: e.target.checked })}
            />
            Priorizar frase exata
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={filters.highlight}
              onChange={(e) => onChange({ highlight: e.target.checked })}
            />
            Destacar termos
          </label>
        </div>

        <FieldGroup title="Tempo de leitura (min)">
          <div className="flex items-center gap-2 text-sm">
            <span>de</span>
            <input
              type="number"
              min={0}
              value={filters.readingTimeMin ?? ""}
              onChange={(e) => onChange({ readingTimeMin: e.target.value ? Number(e.target.value) : null })}
              className="w-16 rounded border border-hairline bg-white px-2 py-1"
            />
            <span>até</span>
            <input
              type="number"
              min={0}
              value={filters.readingTimeMax ?? ""}
              onChange={(e) => onChange({ readingTimeMax: e.target.value ? Number(e.target.value) : null })}
              className="w-16 rounded border border-hairline bg-white px-2 py-1"
            />
          </div>
          <h3 className="mb-2 mt-4 text-xs font-medium tracking-wide text-ink-soft">Data de criação</h3>
          <div className="flex flex-col gap-2 text-sm">
            <input
              type="date"
              value={filters.dateFrom ?? ""}
              onChange={(e) => onChange({ dateFrom: e.target.value || null })}
              className="rounded border border-hairline bg-white px-2 py-1"
            />
            <input
              type="date"
              value={filters.dateTo ?? ""}
              onChange={(e) => onChange({ dateTo: e.target.value || null })}
              className="rounded border border-hairline bg-white px-2 py-1"
            />
          </div>
        </FieldGroup>

        <FieldGroup title="Classificação (label)">
          <div className="flex flex-col gap-1.5 text-sm">
            {LABEL_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.labels.includes(opt.value)}
                  onChange={() => toggleLabel(opt.value)}
                />
                {opt.text}
              </label>
            ))}
          </div>
        </FieldGroup>
      </div>

      <div className="mt-5 flex justify-end gap-2 border-t border-hairline pt-4">
        <button
          onClick={onClear}
          className="rounded border border-hairline px-3 py-1.5 text-sm text-ink-soft transition hover:bg-paper-dim"
        >
          Limpar filtros
        </button>
        <button
          onClick={onApply}
          className="rounded bg-amber px-4 py-1.5 text-sm font-medium text-ink transition hover:bg-amber-dark"
        >
          Aplicar filtros
        </button>
      </div>
    </div>
  );
}
