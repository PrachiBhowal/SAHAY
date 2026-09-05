import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

import { authRouter } from "./routes/auth.js";
import { patientsRouter } from "./routes/patients.js";
import { remindersRouter } from "./routes/reminders.js";
import { memoryAssetsRouter } from "./routes/memoryAssets.js";
import { alertsRouter } from "./routes/alerts.js";
import { syncRouter } from "./routes/sync.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

// NOTE on "Enforce HTTPS/TLS" (Day 2 checklist item):
// Express doesn't terminate TLS itself for a hackathon deploy — Render/Vercel/
// Railway terminate HTTPS at their edge for you. This middleware just makes sure
// that if a request DOES arrive as plain HTTP behind a proxy that forwards the
// original protocol, we redirect to HTTPS instead of silently accepting it.
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] === "http") {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }
  next();
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/patients", patientsRouter);
app.use("/api/patients", remindersRouter);
app.use("/api/patients", memoryAssetsRouter);
app.use("/api/patients", alertsRouter);
app.use("/api/sync", syncRouter);

// Standard error shape fallback (CONTRACTS.md ยง4)
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: true, message: "Internal server error", code: "INTERNAL_ERROR" });
});

const PORT = process.env.BACKEND_PORT || 4000;
app.listen(PORT, () => console.log(`SAHAY backend listening on :${PORT}`));
