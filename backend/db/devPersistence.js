import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, ".sahay-dev-data.json");

const emptyData = () => ({ caregivers: [], patients: [], links: [] });

async function readData() {
    try {
        const raw = await fs.readFile(DATA_FILE, "utf8");
        const parsed = JSON.parse(raw);
        return {
            caregivers: Array.isArray(parsed.caregivers) ? parsed.caregivers : [],
            patients: Array.isArray(parsed.patients) ? parsed.patients : [],
            links: Array.isArray(parsed.links) ? parsed.links : [],
        };
    } catch (error) {
        if (error.code === "ENOENT") return emptyData();
        throw error;
    }
}

async function writeData(data) {
    await fs.writeFile(DATA_FILE, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function saveDevCaregiver(caregiver) {
    const data = await readData();
    const index = data.caregivers.findIndex((item) => item.id === caregiver.id);
    if (index === -1) data.caregivers.push(caregiver);
    else data.caregivers[index] = { ...data.caregivers[index], ...caregiver };
    await writeData(data);
}

export async function saveDevPatient(patient) {
    const data = await readData();
    const index = data.patients.findIndex((item) => item.id === patient.id);
    if (index === -1) data.patients.push(patient);
    else data.patients[index] = { ...data.patients[index], ...patient };
    await writeData(data);
}

export async function saveDevLink(caregiverId, patientId) {
    const data = await readData();
    if (!data.links.some((link) => link.caregiver_id === caregiverId && link.patient_id === patientId)) {
        data.links.push({ caregiver_id: caregiverId, patient_id: patientId });
        await writeData(data);
    }
}

export async function hydrateDevData(pool) {
    const data = await readData();
    for (const caregiver of data.caregivers) {
        await pool.query(
            `INSERT INTO caregivers (id, name, email, caregiver_code, password_hash, role, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
            [caregiver.id, caregiver.name, caregiver.email, caregiver.caregiver_code, caregiver.password_hash, caregiver.role, caregiver.created_at]
        );
    }
    for (const patient of data.patients) {
        await pool.query(
            `INSERT INTO patients (id, name, language_pref, region_village, access_code_hash, created_at)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
            [patient.id, patient.name, patient.language_pref, patient.region_village, patient.access_code_hash, patient.created_at]
        );
    }
    for (const link of data.links) {
        await pool.query(
            `INSERT INTO caregiver_patients (caregiver_id, patient_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [link.caregiver_id, link.patient_id]
        );
    }
}
