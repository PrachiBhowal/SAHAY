import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { pool } from "../db/index.js";
import { signToken, errorBody, requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

function makeCaregiverCode() {
  return `CG-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

function makePatientId() {
  return `patient-${crypto.randomUUID()}`;
}

async function getLinkedPatientIds(caregiverId) {
  const linkedResult = await pool.query(
    "SELECT patient_id FROM caregiver_patients WHERE caregiver_id = $1",
    [caregiverId]
  );
  return linkedResult.rows.map((r) => r.patient_id);
}

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
  const caregiver_code = makeCaregiverCode();
  const password_hash = bcrypt.hashSync(password, 10);
  const created_at = new Date().toISOString();

  await pool.query(
    "INSERT INTO caregivers (id, name, email, caregiver_code, password_hash, role, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [id, name, email, caregiver_code, password_hash, role, created_at]
  );

  const user = { id, role, email, name, caregiver_code, linked_patient_ids: [] };
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

  let caregiver_code = caregiver.caregiver_code;
  if (!caregiver_code) {
    caregiver_code = makeCaregiverCode();
    await pool.query("UPDATE caregivers SET caregiver_code = $1 WHERE id = $2", [caregiver_code, caregiver.id]);
  }
  const linked_patient_ids = await getLinkedPatientIds(caregiver.id);

  const user = {
    id: caregiver.id,
    role: caregiver.role,
    email: caregiver.email,
    name: caregiver.name,
    caregiver_code,
    linked_patient_ids,
  };
  const token = signToken(user);
  res.json({ token, user });
});

// POST /api/auth/patient-signup
// Creates a patient identity and optionally links it to a caregiver code.
authRouter.post("/patient-signup", async (req, res) => {
  const { name, language_pref = "en", region_village = "", access_code, caregiver_code } = req.body || {};
  if (!name || !access_code) {
    return res.status(400).json(errorBody("name and access_code are required", "VALIDATION_ERROR"));
  }
  if (!/^[0-9]{4,8}$/.test(String(access_code))) {
    return res.status(400).json(errorBody("access_code must be 4 to 8 digits", "VALIDATION_ERROR"));
  }

  const patientId = makePatientId();
  const createdAt = new Date().toISOString();
  const accessCodeHash = bcrypt.hashSync(String(access_code), 10);
  let caregiver = null;

  if (caregiver_code) {
    const caregiverResult = await pool.query(
      "SELECT id, caregiver_code FROM caregivers WHERE caregiver_code = $1",
      [String(caregiver_code).trim().toUpperCase()]
    );
    caregiver = caregiverResult.rows[0];
    if (!caregiver) return res.status(404).json(errorBody("Caregiver code not found", "NOT_FOUND"));
  }

  await pool.query(
    `INSERT INTO patients (id, name, language_pref, region_village, access_code_hash, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [patientId, name.trim(), language_pref, region_village.trim(), accessCodeHash, createdAt]
  );

  if (caregiver) {
    await pool.query(
      "INSERT INTO caregiver_patients (caregiver_id, patient_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [caregiver.id, patientId]
    );
  }

  const user = { id: patientId, role: "patient", patient_id: patientId, name: name.trim() };
  res.status(201).json({
    token: signToken(user),
    user,
    patient_id: patientId,
    access_code: String(access_code),
    linked_caregiver: Boolean(caregiver),
  });
});

// POST /api/auth/link-patient { patient_id }
authRouter.post("/link-patient", requireAuth, async (req, res) => {
  if (!["family", "asha_worker"].includes(req.user.role)) {
    return res.status(403).json(errorBody("Only caregivers can add patients", "FORBIDDEN"));
  }
  const patientId = String(req.body?.patient_id || "").trim();
  if (!patientId) return res.status(400).json(errorBody("patient_id is required", "VALIDATION_ERROR"));

  const patientResult = await pool.query("SELECT id FROM patients WHERE id = $1", [patientId]);
  if (!patientResult.rows[0]) return res.status(404).json(errorBody("Patient ID not found", "NOT_FOUND"));
  await pool.query(
    "INSERT INTO caregiver_patients (caregiver_id, patient_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [req.user.id, patientId]
  );
  res.json({ patient_id: patientId, linked: true });
});

// POST /api/auth/link-caregiver { caregiver_code }
authRouter.post("/link-caregiver", requireAuth, async (req, res) => {
  if (req.user.role !== "patient") {
    return res.status(403).json(errorBody("Only patients can add caregivers", "FORBIDDEN"));
  }
  const caregiverCode = String(req.body?.caregiver_code || "").trim().toUpperCase();
  if (!caregiverCode) return res.status(400).json(errorBody("caregiver_code is required", "VALIDATION_ERROR"));

  const caregiverResult = await pool.query("SELECT id FROM caregivers WHERE caregiver_code = $1", [caregiverCode]);
  const caregiver = caregiverResult.rows[0];
  if (!caregiver) return res.status(404).json(errorBody("Caregiver code not found", "NOT_FOUND"));
  await pool.query(
    "INSERT INTO caregiver_patients (caregiver_id, patient_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [caregiver.id, req.user.patient_id]
  );
  res.json({ caregiver_id: caregiver.id, caregiver_code: caregiverCode, linked: true });
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

// POST /api/auth/patient-login { patient_id, access_code } -> { token, user }
// Each patient has an individual access code. The old device token remains a
// fallback for records created before patient access codes were introduced.
authRouter.post("/patient-login", async (req, res) => {
  const { patient_id, access_code, device_token } = req.body || {};
  if (!patient_id || (!access_code && !device_token)) {
    return res.status(400).json(errorBody("patient_id and access_code are required", "VALIDATION_ERROR"));
  }

  const { rows } = await pool.query("SELECT * FROM patients WHERE id = $1", [patient_id]);
  const patient = rows[0];
  if (!patient) {
    return res.status(404).json(errorBody("Patient not found", "NOT_FOUND"));
  }

  const hasValidAccessCode = patient.access_code_hash && access_code
    ? bcrypt.compareSync(access_code, patient.access_code_hash)
    : false;
  const hasValidLegacyToken = !patient.access_code_hash && patient.device_token_hash && device_token
    ? bcrypt.compareSync(device_token, patient.device_token_hash)
    : false;
  if (!hasValidAccessCode && !hasValidLegacyToken) {
    return res.status(401).json(errorBody("Invalid patient credentials", "UNAUTHORIZED"));
  }

  const user = { id: patient.id, role: "patient", patient_id: patient.id, name: patient.name };
  res.json({ token: signToken(user), user });
});

