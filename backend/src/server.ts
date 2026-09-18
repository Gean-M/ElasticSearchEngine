import "dotenv/config";
import express from "express";
import cors from "cors";
import { loadConfig } from "./config/appConfig";
import { buildSearchRoutes } from "./routes/searchRoutes";
import { buildClusterRoutes } from "./routes/clusterRoutes";

const app = express();
const config = loadConfig();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", buildSearchRoutes(config));
app.use("/api", buildClusterRoutes(config));

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`[elasticgui-backend] ouvindo na porta ${port}`);
  console.log(`[elasticgui-backend] Elasticsearch alvo: ${config.scheme}://${config.host}:${config.port} (índice "${config.indexName}")`);
});
