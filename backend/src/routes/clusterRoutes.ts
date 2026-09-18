import { Router } from "express";
import { ElasticsearchClient, describeConnectionError } from "../elasticsearch/client";
import { ClusterService } from "../services/clusterService";
import { AppConfig } from "../models/types";
import { baseUrl } from "../config/appConfig";

export function buildClusterRoutes(config: AppConfig): Router {
  const router = Router();
  const client = new ElasticsearchClient(config);
  const service = new ClusterService(client);

  router.get("/cluster/health", async (_req, res) => {
    try {
      res.json(await service.health());
    } catch (err) {
      const esErr = describeConnectionError(err, config);
      res.status(esErr.statusCode > 0 ? esErr.statusCode : 502).json({ message: esErr.message });
    }
  });

  router.get("/cluster/nodes", async (_req, res) => {
    try {
      res.json(await service.nodes());
    } catch (err) {
      const esErr = describeConnectionError(err, config);
      res.status(esErr.statusCode > 0 ? esErr.statusCode : 502).json({ message: esErr.message });
    }
  });

  router.get("/cluster/indices", async (_req, res) => {
    try {
      res.json(await service.indices());
    } catch (err) {
      const esErr = describeConnectionError(err, config);
      res.status(esErr.statusCode > 0 ? esErr.statusCode : 502).json({ message: esErr.message });
    }
  });

  /** Equivalente ao botão "Testar conexão" do ConnectionDialog.java */
  router.get("/connection/status", async (_req, res) => {
    try {
      const response = await client.ping();
      const version = (response.version ?? {}) as Record<string, unknown>;
      res.json({
        connected: true,
        baseUrl: baseUrl(config),
        indexName: config.indexName,
        username: config.username,
        clusterName: response.cluster_name ?? null,
        versionNumber: version.number ?? null,
      });
    } catch (err) {
      const esErr = describeConnectionError(err, config);
      res.status(200).json({
        connected: false,
        baseUrl: baseUrl(config),
        indexName: config.indexName,
        username: config.username,
        error: esErr.message,
      });
    }
  });

  return router;
}
