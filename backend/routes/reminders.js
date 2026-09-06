import { Router } from "express";
import { v4 as uuid } from "uuid";
import { pool } from "../db/index.js";
import { requireAuth, errorBody } from "../middleware/auth.js";

export const remindersRouter = Router();
remindersRouter.use(requireAuth);

// GET /api/patients/:id/reminders
remindersRouter.get("/:id/reminders", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM reminders WHERE patient_id = $1 ORDER BY time ASC",
    [req.params.id]
  );
  res.json(rows);
});

// POST /api/patients/:id/reminders
// body: { type, time, recurrence, message, voice_note_url? }
// Covers all 4 required categories (medicine, hydration, activity, appointment) + recurrence.
remindersRouter.post("/:id/reminders", async (req, res) => {
  const { type, time, recurrence, message, voice_note_url } = req.body || {};
  const validTypes = ["medicine", "hydration", "activity", "appointment"];
  const validRecurrence = ["daily", "weekly", "once"];

  if (!validTypes.includes(type) || !validRecurrence.includes(recurrence) || !time || !message) {
    return res.status(400).json(errorBody("type, time, recurrence, and message are required/invalid", "VALIDATION_ERROR"));
  }

  const reminder = {
    id: uuid(),
    patient_id: req.params.id,
    type,
    time,
    recurrence,
    message,
    voice_note_url: voice_note_url ?? null,
  };

  await pool.query(
    `INSERT INTO reminders (id, patient_id, type, time, recurrence, message, voice_note_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [reminder.id, reminder.patient_id, reminder.type, reminder.time, reminder.recurrence, reminder.message, reminder.voice_note_url]
  );

  res.status(201).json(reminder);
});

remindersRouter.patch("/:id/reminders/:reminderId", async (req, res) => {
  const { type, time, recurrence, message, voice_note_url } = req.body || {};
  const validTypes = ["medicine", "hydration", "activity", "appointment"];
  const validRecurrence = ["daily", "weekly", "once"];
  if (!validTypes.includes(type) || !validRecurrence.includes(recurrence) || !time || !message) {
    return res.status(400).json(errorBody("type, time, recurrence, and message are required/invalid", "VALIDATION_ERROR"));
  }
  const { rows } = await pool.query(
    `UPDATE reminders
     SET type = $1, time = $2, recurrence = $3, message = $4, voice_note_url = $5
     WHERE id = $6 AND patient_id = $7
     RETURNING *`,
    [type, time, recurrence, message, voice_note_url ?? null, req.params.reminderId, req.params.id]
  );
  if (!rows[0]) return res.status(404).json(errorBody("Reminder not found", "NOT_FOUND"));
  res.json(rows[0]);
});

remindersRouter.delete("/:id/reminders/:reminderId", async (req, res) => {
  const result = await pool.query(
    "DELETE FROM reminders WHERE id = $1 AND patient_id = $2",
    [req.params.reminderId, req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json(errorBody("Reminder not found", "NOT_FOUND"));
  res.status(204).end();
});
