import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_URL || path.join(__dirname, "sahay.sqlite3");

// NOTE on "encryption at rest" (Day 2 checklist item):
// SQLite itself doesn't encrypt the file. For the hackathon demo, the pragmatic
// path is OS/disk-level encryption on the host + never committing the .sqlite3
// file (see .gitignore). If a judge asks specifically about field-level encryption,
// the honest answer for a 6-day build is "transport is encrypted (HTTPS/TLS) and
// the file is not committed / lives on an encrypted disk" rather than claiming
// full at-rest crypto we haven't implemented. Upgrading to SQLCipher or Postgres
// pgcrypto is a documented next step, not a live feature.

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
db.exec(schema);

// ---- Row <-> API shape helpers (DB is flattened, API/contract nests difficulty_tiers) ----

export function patientRowToContract(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    language_pref: row.language_pref,
    region_village: row.region_village,
    difficulty_tiers: {
      memory: row.difficulty_memory,
      attention: row.difficulty_attention,
      recall: row.difficulty_recall,
      pattern: row.difficulty_pattern,
    },
    created_at: row.created_at,
  };
}

export function memoryAssetRowToContract(row) {
  if (!row) return null;
  return { ...row, tags: JSON.parse(row.tags || "[]") };
}

export function alertRowToContract(row) {
  if (!row) return null;
  return { ...row, resolved: !!row.resolved };
}

export function sessionRowToContract(row) {
  if (!row) return null;
  return { ...row, synced: !!row.synced };
}
