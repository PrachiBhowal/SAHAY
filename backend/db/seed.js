import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool, initSchema } from "./index.js";

// Deliberately reuses the same ids/names Person 6's dashboard already has as
// dummy data (PatientOverview.jsx, PatientsList.jsx) so swapping mock -> live
// data is a drop-in change, not a rewrite.

const patients = [
  { id: "p1", name: "Rina Devi", language_pref: "as", region_village: "Nagaon, Assam" },
  { id: "p2", name: "Bipul Saikia", language_pref: "as", region_village: "Jorhat, Assam" },
  { id: "p3", name: "Anima Baruah", language_pref: "as", region_village: "Sivasagar, Assam" },
];

const caregivers = [
  { id: "caregiver-1", name: "Family Member", email: "family@sahay.demo", password: "demo1234", role: "family" },
  { id: "asha-1", name: "ASHA Worker", email: "asha@sahay.demo", password: "demo1234", role: "asha_worker" },
];

async function seed() {
  // Safe to run on every boot (see server start command) — ON CONFLICT DO NOTHING
  // means re-running this never duplicates or wipes existing data, it only fills
  // in the baseline if a fresh Postgres instance came up empty.
  await initSchema();

  for (const p of patients) {
    await pool.query(
      `INSERT INTO patients (id, name, language_pref, region_village, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [p.id, p.name, p.language_pref, p.region_village, new Date().toISOString()]
    );
    await pool.query(
      "UPDATE patients SET device_token_hash = $1 WHERE id = $2 AND device_token_hash IS NULL",
      [bcrypt.hashSync(`patient-demo-token-${p.id}`, 10), p.id]
    );
  }

  for (const c of caregivers) {
    await pool.query(
      `INSERT INTO caregivers (id, name, email, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [c.id, c.name, c.email, bcrypt.hashSync(c.password, 10), c.role, new Date().toISOString()]
    );
  }

  await pool.query(
    `INSERT INTO caregiver_patients (caregiver_id, patient_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    ["caregiver-1", "p1"]
  );
  for (const p of patients) {
    await pool.query(
      `INSERT INTO caregiver_patients (caregiver_id, patient_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      ["asha-1", p.id]
    );
  }

  console.log("Seeded patients, caregivers, and links.");
  console.log("Login with: family@sahay.demo / demo1234 (role: family)");
  console.log("        or: asha@sahay.demo / demo1234 (role: asha_worker)");
  console.log("Patient demo token for p1: patient-demo-token-p1");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
