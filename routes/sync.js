import { Router } from "express";
import { db } from "../db/index.js";
import { requireAuth, errorBody } from "../middleware/auth.js";

export const syncRouter = Router();
syncRouter.use(requireAuth);

// POST /api/sync
// body: { patient_id, queued_sessions: GameSession[], queued_alerts: AlertLog[] }
// returns: { synced_count, failed: [] }
//
// Conflict resolution: LAST-WRITE-WINS, keyed on the client-generated `id`.
// If Person 1's IndexedDB layer already assigned a UUID to a session offline,
// we INSERT OR REPLACE here — whichever push arrives last for a given id wins.
// This is deliberately simple per AI_HANDOFF ยง9 (explainable > clever for a demo).
syncRouter.post("/", (req, res) => {
  const { patient_id, queued_sessions = [], queued_alerts = [] } = req.body || {};
  if (!patient_id) {
    return res.status(400).json(errorBody("patient_id is required", "VALIDATION_ERROR"));
  }

  const failed = [];
  let synced_count = 0;

  const insertSession = db.prepare(
    `INSERT OR REPLACE INTO game_sessions
     (id, patient_id, game_type, timestamp, accuracy, response_time_ms, hints_used, difficulty_tier, synced)
     VALUES (@id, @patient_id, @game_type, @timestamp, @accuracy, @response_time_ms, @hints_used, @difficulty_tier, 1)`
  );

  const insertAlert = db.prepare(
    `INSERT OR REPLACE INTO alert_logs (id, patient_id, trigger_type, timestamp, resolved)
     VALUES (@id, @patient_id, @trigger_type, @timestamp, @resolved)`
  );

  const runBatch = db.transaction(() => {
    for (const session of queued_sessions) {
      try {
        insertSession.run({ ...session, patient_id });
        synced_count++;
      } catch (err) {
        failed.push({ type: "session", id: session.id, reason: err.message });
      }
    }
    for (const alert of queued_alerts) {
      try {
        insertAlert.run({ ...alert, patient_id, resolved: alert.resolved ? 1 : 0 });
        synced_count++;
      } catch (err) {
        failed.push({ type: "alert", id: alert.id, reason: err.message });
      }
    }
  });

  runBatch();

  res.json({ synced_count, failed });
});
