/* ============================================================
   DIFFICULTY ENGINE — shared module
   Owner: Person 4 (Mokshita)

   This is the real implementation of the two functions listed
   under "Person 4 — Difficulty Engine" in CONTRACTS.md section 6:

     getCurrentTier(patientId, gameType): DifficultyTier
     updateTierAfterSession(patientId, gameType, session): DifficultyTier

   Person 1, 2, 3 and 4's games should import THIS module rather
   than reimplementing the rule locally (see the golden rule in
   CONTRACTS.md section 9).

   RULE (as agreed with the team):
     rolling average accuracy > 80%  -> tier UP   (harder)
     rolling average accuracy < 40%  -> tier DOWN (easier)
     otherwise                       -> HOLD
     tier is clamped to [1, 5]; DifficultyTier default = 2

   Why rolling average, not the single just-played round: one lucky
   guess or one bad round from a lapse in attention shouldn't swing
   difficulty on its own. This engine calls performanceTracker's
   recordRound() first, then bases the decision on whatever is in
   that patient/game_type's rolling window (1-5 rounds, matches
   performanceTracker.js's WINDOW_SIZE). Early on, with only 1-2
   rounds recorded, this is close to "decide off the latest round" —
   it naturally stabilizes as the window fills up.

   PERSISTENCE GAP — flag to team: CONTRACTS.md's Patient interface
   says difficulty_tiers is "Updated by: Person 4 (difficulty_tiers,
   via difficulty engine)", but neither section 4 (API) nor section 6
   (Person 1's local storage interface) currently has a write path for
   it — there's no PATCH /patients/:id and no updatePatientTier() on
   Person 1's module. Until that's added, this engine keeps tiers in
   memory only (per browser session) and exposes registerPersistHandler()
   so whoever adds that write path can hook in without editing this file.
   Someone should raise this in CONTRACTS.md section 4 or 6 before demo day,
   or every reload will reset every patient back to tier 2.
   ============================================================ */

import { recordRound, getRollingStats } from "./performanceTracker.js";

const MIN_TIER = 1;
const MAX_TIER = 5;
const DEFAULT_TIER = 2; // contract: "Default starting tier for a new patient = 2"
const HARDER_THRESHOLD = 0.8;
const EASIER_THRESHOLD = 0.4;
const VALID_GAME_TYPES = ["memory", "attention", "recall", "pattern"];

/**
 * @typedef {1|2|3|4|5} DifficultyTier
 * @typedef {import("./performanceTracker.js").GameSession} GameSession
 */

/**
 * @typedef {Object} TierChangeInfo
 * @property {"harder"|"easier"|"hold"} reason
 * @property {DifficultyTier} previousTier
 * @property {DifficultyTier} newTier
 * @property {number} averageAccuracy   // the rolling average that drove the decision
 * @property {number} roundsConsidered  // how many rounds were in the window (1-5)
 */

// key = `${patientId}::${gameType}` -> DifficultyTier
const tiers = new Map();
// key = `${patientId}::${gameType}` -> TierChangeInfo (most recent decision, for UI/debugging)
const lastChange = new Map();
// key = `${patientId}::${gameType}` -> Set<callback>
const subscribers = new Map();
// functions registered to persist a tier change once a real write path exists (see PERSISTENCE GAP above)
const persistHandlers = new Set();

function assertGameType(gameType) {
  if (!VALID_GAME_TYPES.includes(gameType)) {
    console.warn(
      `[difficultyEngine] "${gameType}" is not a valid GameType per CONTRACTS.md. ` +
        `Expected one of: ${VALID_GAME_TYPES.join(", ")}.`
    );
  }
}

function keyFor(patientId, gameType) {
  return `${patientId}::${gameType}`;
}

function clamp(tier) {
  return Math.min(MAX_TIER, Math.max(MIN_TIER, tier));
}

function notify(patientId, gameType) {
  const key = keyFor(patientId, gameType);
  const subs = subscribers.get(key);
  if (!subs || subs.size === 0) return;
  const info = lastChange.get(key);
  subs.forEach((cb) => cb(tiers.get(key), info));
}

/**
 * Read the patient's current tier for a game type. Defaults to 2 (per
 * CONTRACTS.md) if nothing has been recorded/hydrated yet this session.
 * @param {string} patientId
 * @param {"memory"|"attention"|"recall"|"pattern"} gameType
 * @returns {DifficultyTier}
 */
export function getCurrentTier(patientId, gameType) {
  assertGameType(gameType);
  return tiers.get(keyFor(patientId, gameType)) ?? DEFAULT_TIER;
}

/**
 * Record a completed session and (possibly) adjust the tier.
 * Internally calls performanceTracker.recordRound() so callers only
 * need to make one call after a round ends — they don't need to also
 * call recordRound() themselves.
 * @param {string} patientId
 * @param {"memory"|"attention"|"recall"|"pattern"} gameType
 * @param {GameSession} session
 * @returns {DifficultyTier} the (possibly updated) tier
 */
export function updateTierAfterSession(patientId, gameType, session) {
  assertGameType(gameType);
  const key = keyFor(patientId, gameType);
  const previousTier = getCurrentTier(patientId, gameType);

  recordRound(patientId, gameType, session);
  const stats = getRollingStats(patientId, gameType);

  let reason = "hold";
  let newTier = previousTier;
  if (stats.averageAccuracy > HARDER_THRESHOLD) {
    reason = "harder";
    newTier = clamp(previousTier + 1);
  } else if (stats.averageAccuracy < EASIER_THRESHOLD) {
    reason = "easier";
    newTier = clamp(previousTier - 1);
  }

  tiers.set(key, newTier);
  const info = {
    reason,
    previousTier,
    newTier,
    averageAccuracy: stats.averageAccuracy,
    roundsConsidered: stats.roundsCount,
  };
  lastChange.set(key, info);

  persistHandlers.forEach((fn) => {
    try {
      fn(patientId, gameType, newTier, info);
    } catch (err) {
      console.error("[difficultyEngine] persist handler threw:", err);
    }
  });

  notify(patientId, gameType);
  return newTier;
}

/**
 * Seed a patient's tiers from Patient.difficulty_tiers (the canonical
 * shape from CONTRACTS.md section 3) — call this once when a patient
 * record loads, before any rounds are played this session.
 * @param {string} patientId
 * @param {{memory: DifficultyTier, attention: DifficultyTier, recall: DifficultyTier, pattern: DifficultyTier}} difficultyTiers
 */
export function hydrate(patientId, difficultyTiers) {
  VALID_GAME_TYPES.forEach((gameType) => {
    const tier = difficultyTiers?.[gameType];
    if (tier) tiers.set(keyFor(patientId, gameType), clamp(tier));
  });
}

/**
 * Why the last tier decision was made for this patient/game_type —
 * useful for a caregiver-facing tooltip ("moved to level 4 after 85%
 * average accuracy over the last 4 rounds") rather than just a number.
 * @param {string} patientId
 * @param {"memory"|"attention"|"recall"|"pattern"} gameType
 * @returns {TierChangeInfo | null}
 */
export function getLastChangeInfo(patientId, gameType) {
  return lastChange.get(keyFor(patientId, gameType)) ?? null;
}

/**
 * Subscribe to tier changes for a patient/game_type (e.g. to show a
 * "level up" toast in the game, or update a dashboard live).
 * @param {string} patientId
 * @param {"memory"|"attention"|"recall"|"pattern"} gameType
 * @param {(tier: DifficultyTier, info: TierChangeInfo) => void} callback
 * @returns {() => void} unsubscribe
 */
export function subscribe(patientId, gameType, callback) {
  const key = keyFor(patientId, gameType);
  if (!subscribers.has(key)) subscribers.set(key, new Set());
  subscribers.get(key).add(callback);
  return () => subscribers.get(key)?.delete(callback);
}

/**
 * Register a handler to run whenever a tier changes, so a real
 * persistence layer (once CONTRACTS.md has a write path — see the
 * PERSISTENCE GAP note at the top of this file) can save it without
 * this file needing to know about storage or the API.
 * @param {(patientId: string, gameType: string, newTier: DifficultyTier, info: TierChangeInfo) => void} fn
 * @returns {() => void} unregister
 */
export function registerPersistHandler(fn) {
  persistHandlers.add(fn);
  return () => persistHandlers.delete(fn);
}

/** Clears in-memory tiers for a patient (all game types). Mainly for tests/demos. */
export function resetPatient(patientId) {
  VALID_GAME_TYPES.forEach((gt) => {
    const key = keyFor(patientId, gt);
    tiers.delete(key);
    lastChange.delete(key);
  });
}

export const __constants = { MIN_TIER, MAX_TIER, DEFAULT_TIER, HARDER_THRESHOLD, EASIER_THRESHOLD, VALID_GAME_TYPES };
