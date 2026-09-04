import { Router } from "express";
import { v4 as uuid } from "uuid";
import { db, alertRowToContract } from "../db/index.js";
import { requireAuth, errorBody } from "../middleware/auth.js";

export const alertsRouter = Router();
alertsRouter.use(requireAuth);

// GET /api/patients/:id/alerts  — read by Person 6's dashboard alerts panel
alertsRouter.get("/:id/alerts", (req, res) => {
  const rows = db.prepare("SELECT * FROM alert_logs WHERE patient_id = ? ORDER BY timestamp DESC").all(req.params.id);
  res.json(rows.map(alertRowToContract));
});

// POST /api/patients/:id/alerts
// body: { trigger_type }  — written by Person 4 (comfort de-escalation), or auto-detected missed_session here
alertsRouter.post("/:id/alerts", (req, res) => {
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
    resolved: 0,
  };

  db.prepare(
    `INSERT INTO alert_logs (id, patient_id, trigger_type, timestamp, resolved)
     VALUES (@id, @patient_id, @trigger_type, @timestamp, @resolved)`
  ).run(alert);

  res.status(201).json(alertRowToContract(alert));
});
