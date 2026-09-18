import { ElasticsearchClient } from "../elasticsearch/client";

/**
 * Reproduz os comandos administrativos vistos na primeira aula:
 *   GET /_cat/health?v
 *   GET /_cat/nodes?v
 *   GET /_cat/indices?v
 */
export class ClusterService {
  constructor(private readonly client: ElasticsearchClient) {}

  async health(): Promise<Record<string, unknown>[]> {
    return this.client.getRaw("/_cat/health?format=json");
  }

  async nodes(): Promise<Record<string, unknown>[]> {
    return this.client.getRaw("/_cat/nodes?format=json");
  }

  async indices(): Promise<Record<string, unknown>[]> {
    return this.client.getRaw("/_cat/indices?format=json");
  }
}
