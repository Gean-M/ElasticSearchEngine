import { AppConfig } from "../models/types";

// Os padrões abaixo reproduzem exatamente o ambiente usado em aula
// (docker-compose.yml / .env do repositório): host localhost, porta 9200,
// usuário elastic, senha user123, índice wikipedia.
//
// Em Docker, o backend acessa o Elasticsearch pelo nome do serviço
// ("es01"), por isso ES_HOST tem esse valor como padrão quando rodando
// via docker-compose (ver docker/docker-compose.yml).

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
}

export function loadConfig(): AppConfig {
  return {
    scheme: (process.env.ES_SCHEME as "http" | "https") ?? "https",
    host: process.env.ES_HOST ?? "localhost",
    port: Number(process.env.ES_PORT ?? 9200),
    username: process.env.ES_USERNAME ?? "elastic",
    password: process.env.ES_PASSWORD ?? "user123",
    indexName: process.env.ES_INDEX ?? "wikipedia",
    trustAllCerts: bool(process.env.ES_TRUST_ALL_CERTS, true),
  };
}

export function baseUrl(config: AppConfig): string {
  return `${config.scheme}://${config.host}:${config.port}`;
}
