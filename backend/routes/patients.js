import { Router } from "express";
import { v4 as uuid } from "uuid";
import { pool, patientRowToContract, sessionRowToContract } from "../db/index.js";
import { requireAuth, errorBody } from "../middleware/auth.js";

export const patientsRouter = Router();
patientsRouter.use(requireAuth);

// GET /api/patients/:id
patientsRouter.get("/:id", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM patients WHERE id = $1", [req.params.id]);
  if (!rows[0]) return res.status(404).json(errorBody("Patient not found", "NOT_FOUND"));
  res.json(patientRowToContract(rows[0]));
});

// PATCH /api/patients/:id { difficulty_tiers: { memory, attention, recall, pattern } }
patientsRouter.patch("/:id", async (req, res) => {
  const tiers = req.body?.difficulty_tiers;
  const gameTypes = ["memory", "attention", "recall", "pattern"];
  if (!tiers || gameTypes.some((type) => !Number.isInteger(tiers[type]) || tiers[type] < 1 || tiers[type] > 5)) {
    return res.status(400).json(errorBody("difficulty_tiers must include integer values from 1 to 5", "VALIDATION_ERROR"));
  }

  const { rows } = await pool.query(
    `UPDATE patients
     SET difficulty_memory = $1, difficulty_attention = $2,
         difficulty_recall = $3, difficulty_pattern = $4
     WHERE id = $5
     RETURNING *`,
    [tiers.memory, tiers.attention, tiers.recall, tiers.pattern, req.params.id]
  );
  if (!rows[0]) return res.status(404).json(errorBody("Patient not found", "NOT_FOUND"));
  res.json(patientRowToContract(rows[0]));
});

// GET /api/patients/:id/sessions?range=week|month
// This is the endpoint Person 6's dashboard (api/client.js getSessions) already calls.
patientsRouter.get("/:id/sessions", async (req, res) => {
  const range = req.query.range === "month" ? "month" : "week";
  const days = range === "month" ? 30 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { rows } = await pool.query(
    "SELECT * FROM game_sessions WHERE patient_id = $1 AND timestamp >= $2 ORDER BY timestamp ASC",
    [req.params.id, since]
  );

  res.json(rows.map(sessionRowToContract));
});

// POST /api/patients/:id/sessions
// body: { game_type, accuracy, response_time_ms, hints_used, difficulty_tier }
patientsRouter.post("/:id/sessions", async (req, res) => {
  const { game_type, accuracy, response_time_ms, hints_used, difficulty_tier } = req.body || {};
  const validTypes = ["memory", "attention", "recall", "pattern"];
  if (!validTypes.includes(game_type) || (game_type === "recall" ? accuracy !== null : typeof accuracy !== "number")) {
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
  };

  await pool.query(
    `INSERT INTO game_sessions (id, patient_id, game_type, timestamp, accuracy, response_time_ms, hints_used, difficulty_tier, synced)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
    [
      session.id,
      session.patient_id,
      session.game_type,
      session.timestamp,
      session.accuracy,
      session.response_time_ms,
      session.hints_used,
      session.difficulty_tier,
    ]
  );

  res.status(201).json(sessionRowToContract({ ...session, synced: true }));
});
