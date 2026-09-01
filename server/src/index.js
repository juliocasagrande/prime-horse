import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import compression from "compression";
import { env } from "./env.js";
import { requireAuth } from "./middleware/auth.js";
import { simpleResourceRouter } from "./lib/simpleResource.js";

import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import itemsRoutes from "./routes/items.js";
import movementsRoutes from "./routes/movements.js";
import notificationsRoutes from "./routes/notifications.js";
import pushRoutes from "./routes/push.js";
import dashboardRoutes from "./routes/dashboard.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDist = path.resolve(__dirname, "../../web/dist");

const app = express();
app.use(compression());
app.use(cors({ origin: env.webOrigin, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);

const api = express.Router();
api.use(requireAuth);
api.use("/users", usersRoutes);
api.use("/categories", simpleResourceRouter("categories"));
api.use("/locations", simpleResourceRouter("locations"));
api.use("/units", simpleResourceRouter("units"));
api.use("/items", itemsRoutes);
api.use("/movements", movementsRoutes);
api.use("/notifications", notificationsRoutes);
api.use("/push", pushRoutes);
api.use("/dashboard", dashboardRoutes);
app.use("/api", api);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Erro interno do servidor." });
});

// Em produção, o mesmo serviço Railway serve o build estático do PWA.
app.use(express.static(webDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(webDist, "index.html"), (err) => {
    if (err) next(err);
  });
});

app.listen(env.port, () => {
  console.log(`Prime Horse API rodando na porta ${env.port}`);
});
