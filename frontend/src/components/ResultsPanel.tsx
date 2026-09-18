import { useEffect, useState } from "react";
import { SearchResultItem, SortDir, SortField } from "../types";

interface Props {
  items: SearchResultItem[];
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
}

const COLUMNS: { field: SortField; label: string }[] = [
  { field: "title", label: "Título" },
  { field: "readingTime", label: "Tempo de leitura" },
  { field: "label", label: "Classificação" },
  { field: "dtCreation", label: "Data" },
  { field: "score", label: "Score" },
];

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function ResultsPanel({ items, sortField, sortDir, onSort }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(items.length > 0 ? 0 : null);

  useEffect(() => {
    setSelectedIndex(items.length > 0 ? 0 : null);
  }, [items]);

  const selected = selectedIndex !== null ? items[selectedIndex] : null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded border border-hairline">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-paper-dim text-left text-xs uppercase tracking-wide text-ink-soft">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.field}
                  onClick={() => onSort(col.field)}
                  className="cursor-pointer select-none border-b border-hairline px-4 py-2 font-medium transition hover:text-ink"
                  title="Clique para ordenar"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.label}
                    <span className={`text-[10px] ${sortField === col.field ? "text-amber-dark" : "text-transparent"}`}>
                      {sortField === col.field && sortDir === "asc" ? "▲" : "▼"}
                    </span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                className={`cursor-pointer border-b border-hairline/70 transition ${
                  idx === selectedIndex ? "bg-amber/20" : "hover:bg-paper-dim/70"
                }`}
              >
                <td className="px-4 py-2 text-ink">{item.title ?? "(sem título)"}</td>
                <td className="px-4 py-2 font-mono text-ink-soft">
                  {item.readingTime !== null ? `${item.readingTime} min` : "-"}
                </td>
                <td className="px-4 py-2 text-ink-soft">{item.label ?? "-"}</td>
                <td className="px-4 py-2 font-mono text-ink-soft">{item.dtCreation ?? "-"}</td>
                <td className="px-4 py-2 font-mono text-ink-soft">
                  {item.score !== null ? item.score.toFixed(3) : "-"}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-soft">
                  Nenhum resultado ainda. Digite um termo e clique em &ldquo;Buscar&rdquo;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="flex max-h-64 flex-col border-t border-hairline bg-white">
          <div className="flex items-start justify-between gap-4 border-b border-hairline px-4 py-3">
            <div>
              <h3 className="font-serif text-base font-semibold text-ink">
                {selected.title ?? "(sem título)"}
              </h3>
              <p className="text-xs text-ink-soft">{selected.url}</p>
            </div>
            {selected.url && (
              <a
                href={selected.url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded border border-hairline px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-paper-dim"
              >
                Abrir URL
              </a>
            )}
          </div>
          <div
            className="overflow-auto px-4 py-3 text-sm leading-relaxed text-ink"
            dangerouslySetInnerHTML={{
              __html: (selected.highlightHtml ?? escapeHtml(selected.abstractText ?? ""))
                // troca <b> pelo elemento estilizado no index.css
                .replace(/<b>/g, "<b class=\"es-highlight\">"),
            }}
          />
        </div>
      )}
    </div>
  );
}
