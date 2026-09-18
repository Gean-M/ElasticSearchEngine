import { ConnectionStatus } from "../types";

interface Props {
  status: ConnectionStatus | null;
}

export function ConnectionStatusBar({ status }: Props) {
  if (!status) {
    return (
      <div className="border-t border-hairline bg-ink px-4 py-1.5 text-xs text-paper/70">
        Verificando conexão...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 border-t border-hairline bg-ink px-4 py-1.5 text-xs text-paper/80">
      <span
        className={`h-2 w-2 rounded-full ${status.connected ? "bg-signal-green" : "bg-signal-red"}`}
        aria-hidden
      />
      {status.connected ? (
        <span>
          Conectado a {status.baseUrl} · índice: {status.indexName} · usuário: {status.username}
          {status.versionNumber ? ` · Elasticsearch ${status.versionNumber}` : ""}
        </span>
      ) : (
        <span>Falha ao conectar em {status.baseUrl}: {status.error}</span>
      )}
    </div>
  );
}
