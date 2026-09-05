import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./index.js";

// Deliberately reuses the same ids/names Person 6's dashboard already has as
// dummy data (PatientOverview.jsx, PatientsList.jsx) so swapping mock -> live
// data is a drop-in change, not a rewrite.

const patients = [
  { id: "p1", name: "Rina Devi", language_pref: "as", region_village: "Nagaon, Assam" },
  { id: "p2", name: "Bipul Saikia", language_pref: "as", region_village: "Jorhat, Assam" },
  { id: "p3", name: "Anima Baruah", language_pref: "as", region_village: "Sivasagar, Assam" },
];

const insertPatient = db.prepare(
  `INSERT OR IGNORE INTO patients (id, name, language_pref, region_village, created_at)
   VALUES (@id, @name, @language_pref, @region_village, @created_at)`
);
for (const p of patients) {
  insertPatient.run({ ...p, created_at: new Date().toISOString() });
}

const caregivers = [
  { id: "caregiver-1", name: "Family Member", email: "family@sahay.demo", password: "demo1234", role: "family" },
  { id: "asha-1", name: "ASHA Worker", email: "asha@sahay.demo", password: "demo1234", role: "asha_worker" },
];

const insertCaregiver = db.prepare(
  `INSERT OR IGNORE INTO caregivers (id, name, email, password_hash, role, created_at)
   VALUES (@id, @name, @email, @password_hash, @role, @created_at)`
);
for (const c of caregivers) {
  insertCaregiver.run({
    id: c.id,
    name: c.name,
    email: c.email,
    password_hash: bcrypt.hashSync(c.password, 10),
    role: c.role,
    created_at: new Date().toISOString(),
  });
}

const linkStmt = db.prepare(
  `INSERT OR IGNORE INTO caregiver_patients (caregiver_id, patient_id) VALUES (?, ?)`
);
linkStmt.run("caregiver-1", "p1");
for (const p of patients) linkStmt.run("asha-1", p.id);

console.log("Seeded patients, caregivers, and links.");
console.log("Login with: family@sahay.demo / demo1234 (role: family)");
console.log("        or: asha@sahay.demo / demo1234 (role: asha_worker)");
