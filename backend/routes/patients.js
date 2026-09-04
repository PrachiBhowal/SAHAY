import { Router } from "express";
import { v4 as uuid } from "uuid";
import { db, patientRowToContract, sessionRowToContract } from "../db/index.js";
import { requireAuth, errorBody } from "../middleware/auth.js";

export const patientsRouter = Router();
patientsRouter.use(requireAuth);

// GET /api/patients/:id
patientsRouter.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM patients WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json(errorBody("Patient not found", "NOT_FOUND"));
  res.json(patientRowToContract(row));
});

// GET /api/patients/:id/sessions?range=week|month
// This is the endpoint Person 6's dashboard (api/client.js getSessions) already calls.
patientsRouter.get("/:id/sessions", (req, res) => {
  const range = req.query.range === "month" ? "month" : "week";
  const days = range === "month" ? 30 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const rows = db
    .prepare("SELECT * FROM game_sessions WHERE patient_id = ? AND timestamp >= ? ORDER BY timestamp ASC")
    .all(req.params.id, since);

  res.json(rows.map(sessionRowToContract));
});

// POST /api/patients/:id/sessions
// body: { game_type, accuracy, response_time_ms, hints_used, difficulty_tier }
patientsRouter.post("/:id/sessions", (req, res) => {
  const { game_type, accuracy, response_time_ms, hints_used, difficulty_tier } = req.body || {};
  const validTypes = ["memory", "attention", "recall", "pattern"];
  if (!validTypes.includes(game_type) || typeof accuracy !== "number") {
    return res.status(400).json(errorBody("game_type and accuracy are required/invalid", "VALIDATION_ERROR"));
  }

  const session = {
    id: uuid(),
    patient_id: req.params.id,
    game_type,
    timestamp: new Date().toISOString(),
    accuracy,
    response_time_ms: response_time_ms ?? 0,
    hints_used: hints_used ?? 0,
    difficulty_tier: difficulty_tier ?? 2,
    synced: 1,
  };

  db.prepare(
    `INSERT INTO game_sessions (id, patient_id, game_type, timestamp, accuracy, response_time_ms, hints_used, difficulty_tier, synced)
     VALUES (@id, @patient_id, @game_type, @timestamp, @accuracy, @response_time_ms, @hints_used, @difficulty_tier, @synced)`
  ).run(session);

  res.status(201).json(sessionRowToContract(session));
});
