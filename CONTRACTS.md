# TECHNICAL CONTRACTS — SIH26003 NER Dementia Care Platform
**Read this before writing any code that talks to another person's module. This file is the single source of truth for names, types, and shapes — if something here needs to change, flag it to the whole team before changing it, don't silently rename something locally.**

---

## 1. Naming Conventions (apply everywhere, no exceptions)

| Context | Convention | Example |
|---|---|---|
| Database columns / API JSON fields | `snake_case` | `patient_id`, `response_time_ms` |
| JavaScript/TypeScript variables, function names | `camelCase` | `getPatientSessions()`, `difficultyTier` |
| React component names | `PascalCase` | `GameCard`, `ReminderList` |
| CSS/design token variables | `kebab-case` with `--` prefix | `--color-terracotta`, `--font-size-lg` |
| Branch names | `feature/<person>-<short-desc>` | `feature/person3-voice-hooks` |
| Enum-style string values (game_type, reminder type, etc.) | lowercase `snake_case` string | `"attention"`, `"memory_recall"` |

**Rule of thumb:** the network boundary (API + DB) is always `snake_case`. The moment data enters JS/React code, it's fine to keep as-is or convert to `camelCase` locally — just be consistent within your own module.

---

## 2. Canonical Data Types (use these exact enums everywhere — do not invent new values)

```typescript
// Game types — used in GameSession.game_type
type GameType = "memory" | "attention" | "recall" | "pattern";

// Reminder types — used in Reminder.type
type ReminderType = "medicine" | "hydration" | "activity" | "appointment";

// Caregiver roles — used in Caregiver.role
type CaregiverRole = "family" | "asha_worker";

// Memory asset types — used in MemoryAsset.type
type MemoryAssetType = "photo" | "voice" | "music";

// Alert trigger types — used in AlertLog.trigger_type
type AlertTriggerType = "low_engagement" | "manual_distress" | "missed_session";

// Difficulty tiers — integer scale, used across all 4 games
// 1 = easiest, 5 = hardest. Default starting tier for a new patient = 2.
type DifficultyTier = 1 | 2 | 3 | 4 | 5;
```

**Owner note:** Person 4 owns the difficulty engine — if the tier scale needs to change (e.g., more granularity), Person 4 announces it to the team before changing this file.

---

## 3. Full Data Model (canonical field names, types, and who writes/reads each)

```typescript
interface Patient {
  id: string;                    // UUID
  name: string;
  language_pref: string;         // e.g. "as" for Assamese (use Bhashini's language codes)
  region_village: string;
  difficulty_tiers: {
    memory: DifficultyTier;
    attention: DifficultyTier;
    recall: DifficultyTier;
    pattern: DifficultyTier;
  };
  created_at: string;             // ISO 8601
}
// Written by: Person 5 (backend, on patient creation)
// Read by: everyone
// Updated by: Person 4 (difficulty_tiers, via difficulty engine)

interface Caregiver {
  id: string;
  name: string;
  role: CaregiverRole;
  linked_patient_ids: string[];   // array of Patient.id
  created_at: string;
}
// Written/read by: Person 5, Person 6 (dashboard auth)

interface GameSession {
  id: string;
  patient_id: string;
  game_type: GameType;
  timestamp: string;              // ISO 8601
  accuracy: number | null;         // 0.0 to 1.0; null when game_type does not
                                   // produce a meaningful accuracy value
                                   // (currently: "recall")
  response_time_ms: number;
  hints_used: number;
  difficulty_tier: DifficultyTier; // tier AT TIME OF this session
}
// Written by: Person 1, 2, 3, 4 (each game logs its own sessions via Person 1's local storage layer)
// Read by: Person 4 (difficulty engine), Person 6 (dashboard analytics)

interface Reminder {
  id: string;
  patient_id: string;
  type: ReminderType;
  time: string;                    // "HH:mm" 24-hour format
  recurrence: "daily" | "weekly" | "once";
  message: string;
  voice_note_url: string | null;
}
// Written by: Person 5 (backend), Person 6 (dashboard reminder management UI)
// Read by: Person 1 (patient app reminder display), Person 3 (voice playback)

interface MemoryAsset {
  id: string;
  patient_id: string;
  type: MemoryAssetType;
  url: string;
  tags: string[];
  uploaded_by: string;             // Caregiver.id
  created_at: string;
}
// Written by: Person 1 ("Still Useful" recordings), Person 2 (music library links), Person 6 (dashboard photo uploads)
// Read by: Person 1 (Game 1 family photos), Person 4 (comfort de-escalation trigger)

interface AlertLog {
  id: string;
  patient_id: string;
  trigger_type: AlertTriggerType;
  timestamp: string;
  resolved: boolean;
}
// Written by: Person 4 (comfort de-escalation), Person 5 (missed_session, auto-detected)
// Read by: Person 6 (dashboard alerts panel)
```

---

## 4. API Contract (Person 5 owns final source of truth — this is the interface everyone else builds against)

**Base URL (dev):** `http://localhost:4000/api` — confirm actual deployed URL with Person 5 once hosted.

**Auth:** all requests (except `/auth/login`) require `Authorization: Bearer <token>` header.

```
POST   /auth/login
  body: { email, password, role }
  returns: { token, user: { id, role, ... } }

POST   /auth/patient-login
  body: { patient_id, access_code }
  returns: { token, user: { id, role: "patient", patient_id, ... } }

POST   /auth/patient-signup
  body: { name, language_pref, region_village, access_code, caregiver_code? }
  returns: { token, user, patient_id, access_code, linked_caregiver }

POST   /auth/link-patient
  auth: caregiver token
  body: { patient_id }
  returns: { patient_id, linked: true }

POST   /auth/link-caregiver
  auth: patient token
  body: { caregiver_code }
  returns: { caregiver_id, caregiver_code, linked: true }

GET    /patients/:id
  returns: Patient

GET    /patients/:id/sessions?range=week|month
  returns: GameSession[]

POST   /patients/:id/sessions
  body: { game_type, accuracy, response_time_ms, hints_used, difficulty_tier }
  returns: GameSession (with generated id, timestamp)

PATCH  /patients/:id
  body: { difficulty_tiers: { memory, attention, recall, pattern } }
  returns: Patient

GET    /patients/:id/reminders
  returns: Reminder[]

POST   /patients/:id/reminders
  body: { type, time, recurrence, message, voice_note_url? }
  returns: Reminder

GET    /patients/:id/memory-assets
  returns: MemoryAsset[]

POST   /patients/:id/memory-assets
  body: { type, url, tags, uploaded_by }
  returns: MemoryAsset

GET    /patients/:id/alerts
  returns: AlertLog[]

POST   /patients/:id/alerts
  body: { trigger_type }
  returns: AlertLog

PATCH  /patients/:id/alerts/:alert_id
  body: { resolved: boolean }
  returns: AlertLog

POST   /sync
  body: { patient_id, queued_sessions: GameSession[], queued_alerts: AlertLog[] }
  returns: { synced_count, failed: [] }
```

**Standard error response shape (all endpoints):**
```typescript
{
  error: true,
  message: string,      // human-readable
  code: string          // e.g. "UNAUTHORIZED", "NOT_FOUND", "VALIDATION_ERROR"
}
```

---

## 5. Local Storage Schema (Person 1's module — IndexedDB, patient app offline storage)

Mirrors the backend schema exactly (same field names) so sync is a straight push, no field mapping needed.

```
IndexedDB stores:
  - patient        (single record, current device's patient)
  - game_sessions  (queue of unsynced + synced sessions, flag: synced: boolean)
  - reminders      (cached from last sync)
  - memory_assets  (cached, cached photos/voice stored as blobs or URLs)
  - sync_queue     (pending operations waiting for connectivity)
```

New `sync_queue` records use this wrapper shape:
```typescript
{
  type: "session" | "alert" | "memory_asset",
  item: GameSession | AlertLog | MemoryAsset,
  queued_at: string
}
```
The IndexedDB store adds its auto-incrementing `id` as the queue record key.
Older records without `type` remain readable; sync code should fall back to
the payload fields when classifying those records.

**Rule:** any session logged locally gets `synced: false` until `/sync` confirms it, then flips to `true`. Never delete unsynced data.

---

## 6. Shared Module Interfaces (the 3 cross-cutting modules everyone else calls into)

**Person 1 — Local Storage Layer**
```typescript
saveSession(session: GameSession): Promise<void>
getPatientData(): Promise<Patient>
queueForSync(item: GameSession | AlertLog): Promise<void>
updatePatientDifficultyTierLocal(patientId: string, gameType: GameType, newTier: DifficultyTier): Promise<void>
```

**Person 3 — Voice Hooks**
```typescript
useASR(): { transcript: string, isListening: boolean, startListening: () => void }
useTTS(): { speak: (text: string, lang: string) => void, isSpeaking: boolean }
```

**Person 4 — Difficulty Engine**
```typescript
getCurrentTier(patientId: string, gameType: GameType): DifficultyTier
updateTierAfterSession(patientId: string, gameType: GameType, session: GameSession): DifficultyTier
hydrate(patientId: string, difficultyTiers: Patient["difficulty_tiers"]): void
```

> **`hydrate` usage note:** Must be called once per patient load, before any game round is played, seeded from `patient.difficulty_tiers` (the value returned by `GET /patients/:id`). Without this call, the engine's rolling window starts empty and tier defaults to 2 regardless of the patient's actual saved progress. All four games (P1–P4) must call this on mount.

> **Implementation note (P4):** `hydrate` is technically exported from `performanceTracker.js` and re-exposed through the difficulty engine surface — listed here because this is the interface other games call into, not because `difficultyEngine.js` owns the rolling-window logic directly.

> **Persistence note:** `updatePatientDifficultyTierLocal()` now writes tier changes to the local patient record, and the patient app registers it through `registerPersistHandler()`. A backend `PATCH /patients/:id` endpoint and server sync for updated `difficulty_tiers` are still open P5 work if tier changes must persist across devices.

Everyone building a game (Person 1-4) imports and calls these three modules rather than reimplementing storage, voice, or difficulty logic locally.

---

## 7. Environment Variables (names only — actual secrets go in each person's local `.env`, never committed)

```
BHASHINI_API_KEY=
BHASHINI_API_URL=
DATABASE_URL=
JWT_SECRET=
BACKEND_PORT=4000
FRONTEND_URL=
```

---

## 8. Design Tokens (Person 2 owns source of truth — import, don't hardcode hex values anywhere else)

```css
--color-terracotta: #C77B4F;
--color-sage: #8A9A7B;
--color-ochre: #D9A441;
--color-brown: #6B4F3B;
--color-background: #FAF6F0;
--color-text: #3A2E24;

--font-size-base: 20px;
--font-size-lg: 26px;
--font-size-xl: 32px;

--touch-target-min: 64px;
--spacing-unit: 8px;
```

*(Person 2: adjust actual values as the design system develops — the point of this section is that these variable NAMES are what everyone else references, not the specific hex codes, which can evolve.)*

---

## 9. Golden Rule

If you need a field, endpoint, or shared function that isn't listed here, **do not invent your own version silently.** Add it to this file first (or ask the person who owns that area to add it), then build against it. This file only works as a consistency tool if everyone treats it as the single source of truth rather than a starting suggestion.
