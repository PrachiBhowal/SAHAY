import { Router } from "express";
import { v4 as uuid } from "uuid";
import { db } from "../db/index.js";
import { requireAuth, errorBody } from "../middleware/auth.js";

export const remindersRouter = Router();
remindersRouter.use(requireAuth);

// GET /api/patients/:id/reminders
remindersRouter.get("/:id/reminders", (req, res) => {
  const rows = db.prepare("SELECT * FROM reminders WHERE patient_id = ? ORDER BY time ASC").all(req.params.id);
  res.json(rows);
});

// POST /api/patients/:id/reminders
// body: { type, time, recurrence, message, voice_note_url? }
// Covers all 4 required categories (medicine, hydration, activity, appointment) + recurrence.
remindersRouter.post("/:id/reminders", (req, res) => {
  const { type, time, recurrence, message, voice_note_url } = req.body || {};
  const validTypes = ["medicine", "hydration", "activity", "appointment"];
  const validRecurrence = ["daily", "weekly", "once"];

  if (!validTypes.includes(type) || !validRecurrence.includes(recurrence) || !time || !message) {
    return res.status(400).json(errorBody("type, time, recurrence, and message are required/invalid", "VALIDATION_ERROR"));
  }

  const reminder = { id: uuid(), patient_id: req.params.id, type, time, recurrence, message, voice_note_url: voice_note_url ?? null };
  db.prepare(
    `INSERT INTO reminders (id, patient_id, type, time, recurrence, message, voice_note_url)
     VALUES (@id, @patient_id, @type, @time, @recurrence, @message, @voice_note_url)`
  ).run(reminder);

  res.status(201).json(reminder);
});
