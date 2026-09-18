import { Router } from "express";
import { ElasticsearchClient } from "../elasticsearch/client";
import { describeConnectionError } from "../elasticsearch/client";
import { SearchService } from "../services/searchService";
import { AppConfig, SearchFilters, defaultFilters } from "../models/types";

export function buildSearchRoutes(config: AppConfig): Router {
  const router = Router();
  const client = new ElasticsearchClient(config);
  const service = new SearchService(client, config);

  function mergeFilters(body: Partial<SearchFilters>): SearchFilters {
    return { ...defaultFilters(), ...body };
  }

  router.post("/search", async (req, res) => {
    try {
      const filters = mergeFilters(req.body ?? {});
      if (!filters.text || filters.text.trim() === "") {
        res.status(400).json({ message: "O campo de busca (text) é obrigatório." });
        return;
      }
      const result = await service.search(filters);
      res.json(result);
    } catch (err) {
      const esErr = describeConnectionError(err, config);
      res.status(esErr.statusCode > 0 ? esErr.statusCode : 502).json({ message: esErr.message });
    }
  });

  router.post("/search/stats", async (req, res) => {
    try {
      const filters = mergeFilters(req.body ?? {});
      const stats = await service.stats(filters);
      res.json(stats);
    } catch (err) {
      const esErr = describeConnectionError(err, config);
      res.status(esErr.statusCode > 0 ? esErr.statusCode : 502).json({ message: esErr.message });
    }
  });

  return router;
}
