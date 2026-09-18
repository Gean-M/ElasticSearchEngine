import axios, { AxiosInstance } from "axios";
import https from "https";
import { AppConfig } from "../models/types";
import { baseUrl } from "../config/appConfig";
import { EsException } from "./esException";

/**
 * Cliente HTTP para a API REST do Elasticsearch. Equivalente direto do
 * ElasticsearchClient.java: mesma ideia de "trustAllCerts" (aceitar
 * certificados autoassinados) usada no material de aula com
 * `curl --insecure`, apropriada apenas para ambiente de desenvolvimento.
 */
export class ElasticsearchClient {
  private readonly config: AppConfig;
  private readonly http: AxiosInstance;

  constructor(config: AppConfig) {
    this.config = config;
    this.http = axios.create({
      baseURL: baseUrl(config),
      timeout: 15_000,
      auth: { username: config.username, password: config.password },
      httpsAgent:
        config.scheme === "https"
          ? new https.Agent({ rejectUnauthorized: !config.trustAllCerts })
          : undefined,
      validateStatus: () => true, // tratamos o status manualmente, como o Java faz
    });
  }

  async ping(): Promise<Record<string, unknown>> {
    return this.get("/");
  }

  async get(path: string): Promise<Record<string, unknown>> {
    const response = await this.http.get(path);
    return this.unwrap(response);
  }

  async getRaw<T = unknown>(path: string): Promise<T> {
    const response = await this.http.get(path);
    this.assertOk(response);
    return response.data as T;
  }

  async post(path: string, body: unknown): Promise<Record<string, unknown>> {
    const response = await this.http.post(path, body);
    return this.unwrap(response);
  }

  private unwrap(response: { status: number; data: unknown }): Record<string, unknown> {
    this.assertOk(response);
    return (response.data as Record<string, unknown>) ?? {};
  }

  private assertOk(response: { status: number; data: unknown }) {
    if (response.status < 200 || response.status >= 300) {
      const reason = this.extractErrorMessage(response.status, response.data);
      throw new EsException(reason, response.status, JSON.stringify(response.data));
    }
  }

  private extractErrorMessage(status: number, body: unknown): string {
    try {
      const parsed = body as { error?: { reason?: string } };
      if (parsed?.error?.reason) {
        return `HTTP ${status}: ${parsed.error.reason}`;
      }
    } catch {
      // corpo não é o formato esperado; cai no fallback abaixo
    }
    return `HTTP ${status}: ${JSON.stringify(body)}`;
  }
}

export function describeConnectionError(err: unknown, config: AppConfig): EsException {
  if (err instanceof EsException) return err;
  const message = err instanceof Error ? err.message : String(err);
  return new EsException(
    `Falha de conexão com ${baseUrl(config)} (verifique se o Elasticsearch está no ar e se host/porta/usuário/senha estão corretos): ${message}`
  );
}
