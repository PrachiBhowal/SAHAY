import { Router } from "express";
import { v4 as uuid } from "uuid";
import { pool, alertRowToContract } from "../db/index.js";
import { requireAuth, errorBody } from "../middleware/auth.js";

export const alertsRouter = Router();
alertsRouter.use(requireAuth);

// GET /api/patients/:id/alerts  — read by Person 6's dashboard alerts panel
alertsRouter.get("/:id/alerts", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM alert_logs WHERE patient_id = $1 ORDER BY timestamp DESC",
    [req.params.id]
  );
  res.json(rows.map(alertRowToContract));
});

// POST /api/patients/:id/alerts
// body: { trigger_type }  — written by Person 4 (comfort de-escalation), or auto-detected missed_session here
alertsRouter.post("/:id/alerts", async (req, res) => {
  const { trigger_type } = req.body || {};
  const validTriggers = ["low_engagement", "manual_distress", "missed_session"];
  if (!validTriggers.includes(trigger_type)) {
    return res.status(400).json(errorBody("trigger_type is required/invalid", "VALIDATION_ERROR"));
  }

  const alert = {
    id: uuid(),
    patient_id: req.params.id,
    trigger_type,
    timestamp: new Date().toISOString(),
    resolved: false,
  };

  await pool.query(
    `INSERT INTO alert_logs (id, patient_id, trigger_type, timestamp, resolved)
     VALUES ($1, $2, $3, $4, $5)`,
    [alert.id, alert.patient_id, alert.trigger_type, alert.timestamp, alert.resolved]
  );

  res.status(201).json(alertRowToContract(alert));
});

// PATCH /api/patients/:id/alerts/:alertId { resolved: boolean }
alertsRouter.patch("/:id/alerts/:alertId", async (req, res) => {
  if (typeof req.body?.resolved !== "boolean") {
    return res.status(400).json(errorBody("resolved must be a boolean", "VALIDATION_ERROR"));
  }

  const { rows } = await pool.query(
    `UPDATE alert_logs SET resolved = $1
     WHERE id = $2 AND patient_id = $3
     RETURNING *`,
    [req.body.resolved, req.params.alertId, req.params.id]
  );
  if (!rows[0]) return res.status(404).json(errorBody("Alert not found", "NOT_FOUND"));
  res.json(alertRowToContract(rows[0]));
});
