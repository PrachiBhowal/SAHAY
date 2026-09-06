import { Router } from "express";
import { pool } from "../db/index.js";
import { requireAuth, errorBody } from "../middleware/auth.js";

export const syncRouter = Router();
syncRouter.use(requireAuth);

// POST /api/sync
// body: { patient_id, queued_sessions: GameSession[], queued_alerts: AlertLog[], queued_memory_assets: MemoryAsset[] }
// returns: { synced_count, failed: [] }
//
// Conflict resolution: LAST-WRITE-WINS, keyed on the client-generated `id`.
// If Person 1's IndexedDB layer already assigned a UUID to a session offline,
// we UPSERT (INSERT ... ON CONFLICT (id) DO UPDATE) here — whichever push
// arrives last for a given id wins. Deliberately simple per AI_HANDOFF ยง9
// (explainable > clever for a demo).
syncRouter.post("/", async (req, res) => {
  const { patient_id, queued_sessions = [], queued_alerts = [], queued_memory_assets = [] } = req.body || {};
  if (!patient_id) {
    return res.status(400).json(errorBody("patient_id is required", "VALIDATION_ERROR"));
  }
  if (req.user.role === "patient" && req.user.patient_id !== patient_id) {
    return res.status(403).json(errorBody("Patient token does not match patient_id", "FORBIDDEN"));
  }

  const failed = [];
  let synced_count = 0;

  // Checked-out client so BEGIN/COMMIT apply to the same connection —
  // pool.query() alone would hand each statement to a random pooled
  // connection, which breaks transactions.
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const session of queued_sessions) {
      try {
        const validTypes = ["memory", "attention", "recall", "pattern"];
        const validAccuracy = session.game_type === "recall"
          ? session.accuracy === null
          : typeof session.accuracy === "number";
        if (!validTypes.includes(session.game_type) || !validAccuracy) {
          throw new Error("game_type or accuracy is invalid");
        }
        await client.query(
          `INSERT INTO game_sessions
             (id, patient_id, game_type, timestamp, accuracy, response_time_ms, hints_used, difficulty_tier, synced)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
           ON CONFLICT (id) DO UPDATE SET
             game_type = EXCLUDED.game_type,
             timestamp = EXCLUDED.timestamp,
             accuracy = EXCLUDED.accuracy,
             response_time_ms = EXCLUDED.response_time_ms,
             hints_used = EXCLUDED.hints_used,
               difficulty_tier = EXCLUDED.difficulty_tier,
             synced = true`,
          [
            session.id,
            patient_id,
            session.game_type,
            session.timestamp,
            session.accuracy,
            session.response_time_ms,
            session.hints_used,
            session.difficulty_tier,
          ]
        );
        synced_count++;
      } catch (err) {
        failed.push({ type: "session", id: session.id, reason: err.message });
      }
    }

    for (const alert of queued_alerts) {
      try {
        await client.query(
          `INSERT INTO alert_logs (id, patient_id, trigger_type, timestamp, resolved)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET
             trigger_type = EXCLUDED.trigger_type,
             timestamp = EXCLUDED.timestamp,
             resolved = EXCLUDED.resolved`,
          [alert.id, patient_id, alert.trigger_type, alert.timestamp, !!alert.resolved]
        );
        synced_count++;
      } catch (err) {
        failed.push({ type: "alert", id: alert.id, reason: err.message });
      }
    }

    for (const asset of queued_memory_assets) {
      try {
        if (asset.type !== "voice" || !asset.id || !asset.url || !Array.isArray(asset.tags)) {
          throw new Error("memory asset is invalid");
        }
        await client.query(
          `INSERT INTO memory_assets (id, patient_id, type, url, tags, uploaded_by, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             url = EXCLUDED.url,
             tags = EXCLUDED.tags,
             created_at = EXCLUDED.created_at`,
          [asset.id, patient_id, asset.type, asset.url, JSON.stringify(asset.tags), asset.uploaded_by || patient_id, asset.created_at || new Date().toISOString()]
        );
        synced_count++;
      } catch (err) {
        failed.push({ type: "memory_asset", id: asset.id, reason: err.message });
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    return res.status(500).json(errorBody("Sync transaction failed, nothing was saved", "INTERNAL_ERROR"));
  } finally {
    client.release();
  }

  res.json({ synced_count, failed });
});
