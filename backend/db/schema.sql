-- SAHAY backend schema
-- Field names mirror CONTRACTS.md section 3 exactly (snake_case, same names as API/JSON).
-- SQLite chosen for hackathon speed/offline demo reliability (CONTRACTS.md ยง3 allows this).
-- Swap to Postgres later by translating types 1:1 if a judge/demo host requires it.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS patients (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  language_pref     TEXT NOT NULL,
  region_village    TEXT NOT NULL,
  difficulty_memory    INTEGER NOT NULL DEFAULT 2,
  difficulty_attention  INTEGER NOT NULL DEFAULT 2,
  difficulty_recall     INTEGER NOT NULL DEFAULT 2,
  difficulty_pattern    INTEGER NOT NULL DEFAULT 2,
  created_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS caregivers (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('family','asha_worker')),
  created_at  TEXT NOT NULL
);

-- many-to-many: caregiver.linked_patient_ids
CREATE TABLE IF NOT EXISTS caregiver_patients (
  caregiver_id TEXT NOT NULL REFERENCES caregivers(id) ON DELETE CASCADE,
  patient_id   TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  PRIMARY KEY (caregiver_id, patient_id)
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id                TEXT PRIMARY KEY,
  patient_id        TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  game_type         TEXT NOT NULL CHECK (game_type IN ('memory','attention','recall','pattern')),
  timestamp         TEXT NOT NULL,
  accuracy          REAL NOT NULL CHECK (accuracy > 0 AND accuracy <= 1),
  response_time_ms  INTEGER NOT NULL CHECK (response_time_ms >= 0),
  hints_used        INTEGER NOT NULL DEFAULT 0 CHECK (hints_used >= 0),
  difficulty_tier   INTEGER NOT NULL CHECK (difficulty_tier BETWEEN 1 AND 5),
  synced            INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_sessions_patient_time ON game_sessions(patient_id, timestamp);

CREATE TABLE IF NOT EXISTS reminders (
  id              TEXT PRIMARY KEY,
  patient_id      TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('medicine','hydration','activity','appointment')),
  time            TEXT NOT NULL,
  recurrence      TEXT NOT NULL CHECK (recurrence IN ('daily','weekly','once')),
  message         TEXT NOT NULL,
  voice_note_url  TEXT
);

CREATE TABLE IF NOT EXISTS memory_assets (
  id          TEXT PRIMARY KEY,
  patient_id  TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('photo','voice','music')),
  url         TEXT NOT NULL,
  tags        TEXT NOT NULL DEFAULT '[]', -- JSON array stored as text
  uploaded_by TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alert_logs (
  id            TEXT PRIMARY KEY,
  patient_id    TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  trigger_type  TEXT NOT NULL CHECK (trigger_type IN ('low_engagement','manual_distress','missed_session')),
  timestamp     TEXT NOT NULL,
  resolved      INTEGER NOT NULL DEFAULT 0
);
