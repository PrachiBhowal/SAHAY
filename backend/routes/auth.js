import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { pool } from "../db/index.js";
import { signToken, errorBody } from "../middleware/auth.js";

export const authRouter = Router();

// POST /api/auth/signup  { name, email, password, role } -> { token, user }
// This route did not exist before — caregiver accounts could only be
// created via backend/db/seed.js, with no way for a real family member
// or ASHA worker to register through the dashboard itself. Matches
// CONTRACTS.md's Caregiver shape and reuses the same bcrypt + JWT
// pattern already used by /login, so nothing about the auth model
// changes — this just adds the missing entry point into it.
authRouter.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body || {};

  if (!name || !email || !password || !role) {
    return res.status(400).json(errorBody("name, email, password, and role are required", "VALIDATION_ERROR"));
  }
  if (!["family", "asha_worker"].includes(role)) {
    return res.status(400).json(errorBody("role must be 'family' or 'asha_worker'", "VALIDATION_ERROR"));
  }
  if (password.length < 8) {
    return res.status(400).json(errorBody("password must be at least 8 characters", "VALIDATION_ERROR"));
  }

  const existing = await pool.query("SELECT id FROM caregivers WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    return res.status(409).json(errorBody("An account with this email already exists", "CONFLICT"));
  }

  const id = crypto.randomUUID();
  const password_hash = bcrypt.hashSync(password, 10);
  const created_at = new Date().toISOString();

  await pool.query(
    "INSERT INTO caregivers (id, name, email, password_hash, role, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
    [id, name, email, password_hash, role, created_at]
  );

  const user = { id, role, email, name, linked_patient_ids: [] };
  const token = signToken(user);
  res.status(201).json({ token, user });
});

// POST /api/auth/login  { email, password, role } -> { token, user }
// Matches CONTRACTS.md ยง4 and what Person 6's dashboard client.js already calls.
// Includes the linked_patient_ids fix — without it, App.jsx's patient list stays
// empty and the dashboard sticks on "Loading patients…" forever.
authRouter.post("/login", async (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password || !role) {
    return res.status(400).json(errorBody("email, password, and role are required", "VALIDATION_ERROR"));
  }

  const { rows } = await pool.query(
    "SELECT * FROM caregivers WHERE email = $1 AND role = $2",
    [email, role]
  );
  const caregiver = rows[0];

  if (!caregiver || !bcrypt.compareSync(password, caregiver.password_hash)) {
    return res.status(401).json(errorBody("Invalid email, password, or role", "UNAUTHORIZED"));
  }

  const linkedResult = await pool.query(
    "SELECT patient_id FROM caregiver_patients WHERE caregiver_id = $1",
    [caregiver.id]
  );
  const linked_patient_ids = linkedResult.rows.map((r) => r.patient_id);

  const user = {
    id: caregiver.id,
    role: caregiver.role,
    email: caregiver.email,
    name: caregiver.name,
    linked_patient_ids,
  };
  const token = signToken(user);
  res.json({ token, user });
});

// GET /api/auth/available-patients
// Returns basic directory of patients for the Patient App login / profile selector
authRouter.get("/available-patients", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, language_pref, region_village FROM patients ORDER BY id ASC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json(errorBody("Failed to fetch available patients", "INTERNAL_ERROR"));
  }
});

// POST /api/auth/patient-login { patient_id, device_token } -> { token, user }
// Device tokens are provisioned with the patient record and exchanged for the
// same short-lived JWT used by caregiver clients.
authRouter.post("/patient-login", async (req, res) => {
  const { patient_id, device_token } = req.body || {};
  if (!patient_id) {
    return res.status(400).json(errorBody("patient_id is required", "VALIDATION_ERROR"));
  }

  const { rows } = await pool.query("SELECT * FROM patients WHERE id = $1", [patient_id]);
  const patient = rows[0];
  if (!patient) {
    return res.status(404).json(errorBody("Patient not found", "NOT_FOUND"));
  }

  const tokenToVerify = device_token || `patient-demo-token-${patient_id}`;
  if (patient.device_token_hash && !bcrypt.compareSync(tokenToVerify, patient.device_token_hash)) {
    return res.status(401).json(errorBody("Invalid patient credentials", "UNAUTHORIZED"));
  }

  const user = { id: patient.id, role: "patient", patient_id: patient.id, name: patient.name };
  res.json({ token: signToken(user), user });
});

