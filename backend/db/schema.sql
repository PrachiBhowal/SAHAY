-- SAHAY backend schema (Postgres version)
-- Field names mirror CONTRACTS.md section 3 exactly (snake_case, same names as API/JSON).
-- Switched from SQLite to Postgres so demo data survives redeploys (SQLite on
-- Render's free tier lives on an ephemeral disk that resets on every deploy).

CREATE TABLE IF NOT EXISTS patients (
  id                    TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  language_pref         TEXT NOT NULL,
  region_village        TEXT NOT NULL,
  difficulty_memory     INTEGER NOT NULL DEFAULT 2,
  difficulty_attention  INTEGER NOT NULL DEFAULT 2,
  difficulty_recall     INTEGER NOT NULL DEFAULT 2,
  difficulty_pattern    INTEGER NOT NULL DEFAULT 2,
  access_code_hash      TEXT,
  device_token_hash     TEXT,
  created_at            TEXT NOT NULL
);

ALTER TABLE patients ADD COLUMN IF NOT EXISTS device_token_hash TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS access_code_hash TEXT;

CREATE TABLE IF NOT EXISTS caregivers (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  caregiver_code TEXT,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('family','asha_worker')),
  created_at    TEXT NOT NULL
);

ALTER TABLE caregivers ADD COLUMN IF NOT EXISTS caregiver_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS caregivers_caregiver_code_idx ON caregivers(caregiver_code) WHERE caregiver_code IS NOT NULL;

-- many-to-many: caregiver.linked_patient_ids
CREATE TABLE IF NOT EXISTS caregiver_patients (
  caregiver_id TEXT NOT NULL REFERENCES caregivers(id) ON DELETE CASCADE,
  patient_id   TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  PRIMARY KEY (caregiver_id, patient_id)
);

-- NOTE: accuracy's NOT NULL constraint was dropped at some point (see the
-- ALTER TABLE below, kept for anyone re-running this file against an
-- existing DB) rather than fixing whatever was inserting a null accuracy
-- in the first place. Worth someone tracking down which game/route was
-- sending null — this schema now at least bounds it correctly *when
-- present* rather than leaving it fully unconstrained.
CREATE TABLE IF NOT EXISTS game_sessions (
  id                TEXT PRIMARY KEY,
  patient_id        TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  game_type         TEXT NOT NULL CHECK (game_type IN ('memory','attention','recall','pattern')),
  timestamp         TEXT NOT NULL,
  accuracy          REAL CHECK (accuracy IS NULL OR (accuracy > 0 AND accuracy <= 1)),
  response_time_ms  INTEGER NOT NULL CHECK (response_time_ms >= 0),
  hints_used        INTEGER NOT NULL DEFAULT 0 CHECK (hints_used >= 0),
  difficulty_tier   INTEGER NOT NULL CHECK (difficulty_tier BETWEEN 1 AND 5),
  synced            BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE game_sessions ALTER COLUMN accuracy DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_patient_time ON game_sessions(patient_id, timestamp);

CREATE TABLE IF NOT EXISTS reminders (
  id             TEXT PRIMARY KEY,
  patient_id     TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type           TEXT NOT NULL CHECK (type IN ('medicine','hydration','activity','appointment')),
  time           TEXT NOT NULL,
  recurrence     TEXT NOT NULL CHECK (recurrence IN ('daily','weekly','once')),
  message        TEXT NOT NULL,
  voice_note_url TEXT
);

CREATE TABLE IF NOT EXISTS memory_assets (
  id          TEXT PRIMARY KEY,
  patient_id  TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('photo','voice','music')),
  url         TEXT NOT NULL,
  tags        TEXT NOT NULL DEFAULT '[]', -- JSON array stored as text, same as SQLite version
  uploaded_by TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alert_logs (
  id           TEXT PRIMARY KEY,
  patient_id   TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('low_engagement','manual_distress','missed_session')),
  timestamp    TEXT NOT NULL,
  resolved     BOOLEAN NOT NULL DEFAULT false
);
