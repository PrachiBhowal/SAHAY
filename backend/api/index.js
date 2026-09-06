import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

import { initSchema, isUsingDevDatabase } from "../db/index.js";
import { seedDevelopmentData } from "../db/devSeed.js";
import { authRouter } from "../routes/auth.js";
import { patientsRouter } from "../routes/patients.js";
import { remindersRouter } from "../routes/reminders.js";
import { memoryAssetsRouter } from "../routes/memoryAssets.js";
import { alertsRouter } from "../routes/alerts.js";
import { syncRouter } from "../routes/sync.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

// Vercel handles TLS/HTTPS termination itself — every request already arrives
// over HTTPS at the platform edge, so there's no manual redirect middleware
// needed here (unlike the Render/self-hosted version of this file).

// NOTE on serverless + schema init:
// Unlike a normal always-running server, there's no single "startup" moment
// here — Vercel spins up a fresh function instance per cold start. We cache
// the schema-init promise at module scope so it only actually runs once per
// warm instance, and every request awaits it before hitting a route. Since
// initSchema() is just CREATE TABLE IF NOT EXISTS statements, re-running it
// on a fresh cold start is cheap and safe either way.
let schemaReady = null;
app.use((req, res, next) => {
    if (!schemaReady) {
        schemaReady = initSchema().then(async () => {
            if (isUsingDevDatabase) await seedDevelopmentData();
        });
    }
    schemaReady.then(() => next()).catch(next);
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

// No app.listen() here — Vercel calls this exported app directly as a
// request handler for every incoming request. This is the standard,
// documented way to deploy a full Express app on Vercel's Node runtime.
export default app;
