import pg from "pg";
import { newDb } from "pg-mem";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProduction = process.env.NODE_ENV === "production";
export const isUsingDevDatabase = !process.env.DATABASE_URL && !isProduction;
let pool;

if (process.env.DATABASE_URL) {
  // Render's managed Postgres requires SSL for external connections but presents
  // a cert that Node's default TLS validation rejects as self-signed/untrusted.
  // rejectUnauthorized: false is the standard workaround for hosted Postgres.
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
} else if (isUsingDevDatabase) {
  // Keep local development self-contained. This database is process-local and
  // resets on restart; production must always use a real DATABASE_URL.
  const devDatabase = newDb({ autoCreateForeignKeyIndices: true });
  pool = new (devDatabase.adapters.createPg().Pool)();
  console.warn("[backend] DATABASE_URL is not set; using an in-memory development database.");
} else {
  throw new Error(
    "DATABASE_URL is required in production. Set it to the deployed Postgres connection string."
  );
}

export { pool };

// Call this once at startup (see server.js) before accepting requests.
export async function initSchema() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
  await pool.query(schema);
}

// Small helper so route files don't each import `pg` and re-derive `.rows`.
export async function query(text, params) {
  return pool.query(text, params);
}

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

// Postgres BOOLEAN columns already come back as real true/false via `pg`,
// unlike SQLite's 0/1 integers — no !!row.resolved conversion needed anymore,
// but keeping these named passthroughs so route files don't need to change.
export function alertRowToContract(row) {
  if (!row) return null;
  return row;
}

export function sessionRowToContract(row) {
  if (!row) return null;
  return row;
}
