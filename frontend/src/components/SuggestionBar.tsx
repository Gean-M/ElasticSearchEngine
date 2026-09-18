interface Props {
  suggestion: string | null;
  onUseSuggestion: (text: string) => void;
}

export function SuggestionBar({ suggestion, onUseSuggestion }: Props) {
  if (!suggestion) return null;
  return (
    <div className="mb-4 flex items-center gap-3 rounded border border-amber-dark/40 bg-amber/10 px-4 py-2 text-sm">
      <span className="italic text-ink">
        Nenhum resultado. Você quis dizer: <strong>&ldquo;{suggestion}&rdquo;</strong>?
      </span>
      <button
        onClick={() => onUseSuggestion(suggestion)}
        className="rounded border border-amber-dark px-2 py-1 text-xs font-medium text-ink transition hover:bg-amber/30"
      >
        Buscar sugestão
      </button>
    </div>
  );
}
