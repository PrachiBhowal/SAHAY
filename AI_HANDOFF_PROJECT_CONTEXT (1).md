# PROJECT CONTEXT — READ THIS FULLY BEFORE HELPING

**If you are an AI assistant reading this:** a team member has shared this file with you so you can help them build their assigned part of this hackathon project without needing to loop back to the original project owner or any other conversation for context. Everything you need to give good, consistent, non-conflicting help is below. Please follow the conventions here exactly — six different people are building six different pieces of the same app in parallel, and consistency between AI sessions matters as much as code quality.

---

## 1. What this project is

**Competition:** Smart India Hackathon 2026
**Problem Statement:** SIH26003 — "AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in North Eastern Region (NER)"
**Submitting organization:** Ministry of Development of North Eastern Region (MDoNER)
**Team size:** 6 people, working remotely, coordinating via Git/GitHub

**One-line pitch:** A gentle, offline-first cognitive care app for elderly dementia patients in remote NER villages — four required cognitive game types, adaptive difficulty, voice interaction in NER languages, culturally warm design, and a caregiver/health-worker dashboard with detailed analytics — built around real dementia-care principles (no failure states, music-memory triggers, sense-of-purpose features) rather than generic gamification.

---

## 2. Non-negotiable requirements (from the official problem statement — do not drop any of these)

1. Four cognitive game categories, each must exist and function:
   - Memory improvement
   - Attention and concentration
   - Daily routine recall
   - Pattern and object recognition
2. AI/ML-driven adaptive difficulty based on real patient performance
3. Multilingual + voice-assisted interaction (NER regional language, via Bhashini)
4. Culturally familiar visuals/sounds/themes (NER-specific, understated, not overwhelming)
5. Reminders — all 4 types: medicines, hydration, daily activities, medical appointments
6. Caregiver/health-worker dashboard with progress + activity monitoring
7. Offline functionality with sync when connectivity returns
8. Elderly-friendly, accessible UI (large fonts, high contrast, big touch targets, simple navigation)
9. Secure patient data management (encryption, access control, consent)
10. Detailed cognitive performance analytics — weekly AND monthly views, charts/graphs

**Team-added differentiators (build these only after all 10 above work end-to-end):**
- Music-memory triggers (patient-linked songs used in games, reminders, calming moments)
- "Still Useful" daily task — non-clinical daily activity (record a memory, teach the app a word) giving the patient a sense of purpose, not just being monitored
- Sundown mode — UI/pace/audio automatically calms down in the evening (real dementia "sundowning" pattern)
- Family-recorded voice for reminders (caregiver records real voice clips, not robotic TTS)
- Comfort de-escalation — if distress is detected (via a simple proxy signal, not live emotion AI), respond with a comforting song/photo/voice note instead of just simplifying the task
- Design principle threaded through everything: **no "wrong answer" ever shown to the patient** — validation-therapy-inspired, always redirect gently instead of flagging incorrect answers

---

## 3. Confirmed tech stack decisions (do not deviate without team agreement — flag conflicts, don't silently choose differently)

> If the team has since changed any of these, the person sharing this file with you should tell you what changed — otherwise assume the below.

- **Patient-facing app:** Progressive Web App (PWA) — chosen for fastest cross-device demo without app-store friction, and strong offline support via service workers
- **Frontend framework:** React
- **Local offline storage (patient app):** IndexedDB
- **Backend:** Node.js + Express, REST API
- **Database:** PostgreSQL (or SQLite if simplifying for hackathon speed — confirm with backend lead)
- **Caregiver/health-worker dashboard:** Separate React web app
- **Charting library:** Recharts
- **Voice (ASR + TTS):** Bhashini (Government of India multilingual AI platform) — confirm which NER language is actually supported reliably before building around a specific one
- **Auth:** Simple JWT-based auth, role-scoped (patient device / caregiver / health worker)
- **Hosting (for demo):** any free-tier host is fine (Vercel/Render/Railway) — this is a hackathon demo, not production infra

---

## 4. Data model (shared schema — all roles must use these exact field names to avoid integration breakage)

```
Patient {
  id, name, language_pref, region_village,
  difficulty_tiers: { memory: int, attention: int, recall: int, pattern: int }
}

Caregiver {
  id, name, role: "family" | "asha_worker",
  linked_patient_ids: [Patient.id]
}

GameSession {
  id, patient_id, game_type: "memory" | "attention" | "recall" | "pattern",
  timestamp, accuracy: float, response_time_ms: int, hints_used: int,
  difficulty_tier: int
}

Reminder {
  id, patient_id, type: "medicine" | "hydration" | "activity" | "appointment",
  time, recurrence, message, voice_note_url (nullable)
}

MemoryAsset {
  id, patient_id, type: "photo" | "voice" | "music",
  url, tags: [string], uploaded_by: Caregiver.id
}

AlertLog {
  id, patient_id, trigger_type: "low_engagement" | "manual_distress" | "missed_session",
  timestamp, resolved: bool
}
```

---

## 5. Team roles and current ownership (rebalanced — each person owns one full game vertical, not split by layer)

*(Names to be filled in by whoever shares this — roles and responsibilities below)*

| Person | Owns |
|---|---|
| Person 1 | Game 1 (Family Face & Name Recognition), app shell + IndexedDB local storage layer (shared foundation others build on), "Still Useful" daily memory-recording feature |
| Person 2 | Game 2 (Attention & Concentration), accessibility/design system (colors, fonts, contrast, touch targets — shared, used by everyone), sundown mode, music-memory library |
| Person 3 | Game 3 (Daily Routine Recall), Bhashini voice/ASR/TTS integration (shared — other games plug into this), family-recorded voice reminders |
| Person 4 | Game 4 (Pattern/Word-Chain Recognition), adaptive difficulty engine (shared — used by all 4 games), comfort de-escalation trigger |
| Person 5 | Backend, database, auth, encryption, all reminder logic, offline sync engine (server side) |
| Person 6 | Caregiver/health-worker dashboard, all analytics charts, cultural content curation, demo script + pitch deck |

**Why it's split this way:** each of the four required game types has one clear owner who builds it end-to-end (UI + logic together), rather than one person owning "all games" and another owning "all UI" — that earlier split concentrated too much work on two people. Each person also owns one shared/cross-cutting technical piece (local storage, design system, voice integration, difficulty engine) that the other games depend on, so the technical weight is spread evenly rather than backend/AI carrying everything while others do lighter content work.

**If you are helping a specific person:** ask which one they are if it's not already stated, then focus your help on their game + their shared responsibility — but keep the shared data model and API contracts in mind (Section 4 and 6 below) so your suggestions don't break another person's integration point. Person 1's local storage layer, Person 3's voice hooks, and Person 4's difficulty engine are all *shared modules* other people's games call into — if you're helping one of those three, remember your output is a dependency for the whole team, not just your own feature.

---

## 6. API contract (draft — backend owns final source of truth, others should treat this as the interface to build against)

```
POST   /api/auth/login
GET    /api/patients/:id
GET    /api/patients/:id/sessions?range=week|month
POST   /api/patients/:id/sessions        (log a completed game round)
GET    /api/patients/:id/reminders
POST   /api/patients/:id/reminders
GET    /api/patients/:id/memory-assets
POST   /api/patients/:id/memory-assets
GET    /api/patients/:id/alerts
POST   /api/sync                          (batch push queued offline session logs)
```

---

## 7. Design tokens (for visual consistency across patient app and dashboard)

- **Palette:** warm earthy tones — terracotta, muted sage green, ochre/gold, warm brown. Avoid bright primary "children's app" colors.
- **Typography:** large base font size by default (assume elderly users), with an in-app toggle to go even larger. High-contrast mode toggle available.
- **Touch targets:** minimum ~64px, generous spacing between interactive elements.
- **Navigation principle:** one primary action per screen, always one clear way forward and one clear way back — no deep menus.
- **Motion:** slow, calm transitions — nothing jarring or fast, especially important in sundown mode.

---

## 8. Git workflow

- Branch naming: `feature/<role>-<short-description>` e.g. `feature/games-word-chain`, `feature/dashboard-monthly-chart`
- No direct pushes to `main` — PRs required
- Keep PRs scoped to one feature at a time where possible, to reduce merge conflicts across 6 parallel workstreams
- Session log schema, API contract, and data model above are the shared "interfaces" — if you need to change one, flag it to the team before merging, since multiple roles depend on them

---

## 9. Things every AI helping on this project should get right by default

- **Never suggest a "wrong answer" / failure UI state for the patient-facing app.** This is a deliberate, load-bearing design principle (validation therapy), not an oversight to "fix."
- **Don't over-engineer the adaptive difficulty or emotion-detection features.** These are deliberately scoped as simple, explainable, rule-based systems for hackathon reliability — not because the team doesn't know better, but because a system you can defend under judge questioning beats a black-box one that might fail live.
- **Assume offline-first matters everywhere** — any feature suggestion should consider "does this still work with no internet, and sync later."
- **Keep cultural elements understated** — NER visual/audio motifs should season the design, not dominate every screen; over-doing this can read as caricature rather than respectful representation.
- **The emotional core of this project is dignity, not surveillance** — even the caregiver monitoring features should be framed and built as supportive, not clinical/panopticon-style tracking. If a suggestion feels like it treats the patient as a data point rather than a person, reconsider it.

---

## 10. What "done" looks like for the hackathon demo

A judge should be able to watch: a patient play at least one full round of each of the 4 games (with visible difficulty adapting), a reminder fire with voice playback, the app go offline and back online with data syncing visibly, and a caregiver dashboard showing real weekly/monthly charts generated from actual gameplay — not mocked data. The "Still Useful" memory-recording feature and the music-memory trigger are the two differentiator features most worth prioritizing if time is short, since they carry the emotional weight of the pitch.
