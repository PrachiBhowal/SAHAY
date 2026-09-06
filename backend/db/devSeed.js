import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { pool } from "./index.js";
import { hydrateDevData } from "./devPersistence.js";

const patients = [
    { id: "p1", name: "Rina Devi", language_pref: "as", region_village: "Nagaon, Assam", access_code: "2468" },
    { id: "p2", name: "Bipul Saikia", language_pref: "as", region_village: "Jorhat, Assam", access_code: "1357" },
    { id: "p3", name: "Anima Baruah", language_pref: "as", region_village: "Sivasagar, Assam", access_code: "8642" },
];

const caregivers = [
    { id: "caregiver-1", name: "Family Member", email: "family@sahay.demo", password: "demo1234", role: "family", caregiver_code: "CG-FAMILY-1" },
    { id: "asha-1", name: "ASHA Worker", email: "asha@sahay.demo", password: "demo1234", role: "asha_worker", caregiver_code: "CG-ASHA-1" },
];

export async function seedDevelopmentData() {
    for (const patient of patients) {
        await pool.query(
            `INSERT INTO patients (id, name, language_pref, region_village, access_code_hash, created_at)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
            [patient.id, patient.name, patient.language_pref, patient.region_village, bcrypt.hashSync(patient.access_code, 10), new Date().toISOString()]
        );
    }

    for (const caregiver of caregivers) {
        await pool.query(
            `INSERT INTO caregivers (id, name, email, caregiver_code, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
            [caregiver.id, caregiver.name, caregiver.email, caregiver.caregiver_code, bcrypt.hashSync(caregiver.password, 10), caregiver.role, new Date().toISOString()]
        );
    }

    await pool.query(
        `INSERT INTO caregiver_patients (caregiver_id, patient_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        ["caregiver-1", "p1"]
    );
    for (const patient of patients) {
        await pool.query(
            `INSERT INTO caregiver_patients (caregiver_id, patient_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            ["asha-1", patient.id]
        );
    }

    await hydrateDevData(pool);
}

export function createDevelopmentPatientId() {
    return `patient-${crypto.randomUUID()}`;
}
