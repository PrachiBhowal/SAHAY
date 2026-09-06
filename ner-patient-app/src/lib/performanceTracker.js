/* ============================================================
   PERFORMANCE TRACKER — shared module
   Owner: Person 4 (Mokshita)

   Purpose: keep a rolling window of the last 5 GameSession
   records per (patient, game_type), and derive simple stats
   from that window. This is a SHARED module — Person 1, 2, 3
   and 4's games all call recordRound() after they log a
   session, and the difficulty engine (also Person 4) reads
   getRollingStats() to decide tier changes.

   NOT YET in CONTRACTS.md section 6 — flag to the team and add
   it there before other people build against it. Proposed entry:

   // Person 4 — Rolling Performance Tracker
   getRecentRounds(patientId: string, gameType: GameType): GameSession[]
   recordRound(patientId: string, gameType: GameType, session: GameSession): RollingStats
   getRollingStats(patientId: string, gameType: GameType): RollingStats
   hydrate(patientId: string, gameType: GameType, sessions: GameSession[]): void
   subscribe(patientId: string, gameType: GameType, callback: (stats: RollingStats) => void): () => void

   Data source note: this module does NOT own persistence. It's a
   derived, in-memory rolling cache. On app start, call hydrate()
   with whatever Person 1's local storage layer already has for
   that patient/game_type (e.g. from getPatientData() or the last
   `range=week` sync), so the window isn't empty after a reload.
   During play, call recordRound() right after saveSession() so
   the window and the durable store never drift apart.
   ============================================================ */

const WINDOW_SIZE = 5;
const LOW_ENGAGEMENT_ACCURACY_THRESHOLD = 0.3;
const VALID_GAME_TYPES = ["memory", "attention", "recall", "pattern"];

/**
 * @typedef {Object} GameSession
 * @property {string} patient_id
 * @property {"memory"|"attention"|"recall"|"pattern"} game_type
 * @property {number} accuracy            // 0.0–1.0
 * @property {number} response_time_ms
 * @property {number} hints_used
 * @property {1|2|3|4|5} difficulty_tier
 * @property {string} [timestamp]         // ISO 8601, set by caller or backend
 */

/**
 * @typedef {Object} RollingStats
 * @property {number} roundsCount              // 0–5, how many rounds are in the window
 * @property {number} averageAccuracy          // 0.0–1.0
 * @property {number} averageResponseTimeMs
 * @property {number} averageHintsUsed
 * @property {number} lowEngagementCount       // rounds in window with accuracy <= 0.3
 * @property {boolean} isLowEngagementStreak   // true if the window is full (5) AND every round is low-engagement
 * @property {"improving"|"declining"|"stable"} trend
 */

// key = `${patientId}::${gameType}` -> GameSession[], most recent first, length <= WINDOW_SIZE
const windows = new Map();
// key = `${patientId}::${gameType}` -> Set<callback>
const subscribers = new Map();

function assertGameType(gameType) {
  if (!VALID_GAME_TYPES.includes(gameType)) {
    console.warn(
      `[performanceTracker] "${gameType}" is not a valid GameType per CONTRACTS.md. ` +
      `Expected one of: ${VALID_GAME_TYPES.join(", ")}. Did you mean to add it to CONTRACTS.md first?`
    );
  }
}

function keyFor(patientId, gameType) {
  return `${patientId}::${gameType}`;
}

function computeStats(rounds) {
  const roundsCount = rounds.length;
  if (roundsCount === 0) {
    return {
      roundsCount: 0,
      averageAccuracy: 0,
      averageResponseTimeMs: 0,
      averageHintsUsed: 0,
      lowEngagementCount: 0,
      isLowEngagementStreak: false,
      trend: "stable",
    };
  }

  const sum = (fn) => rounds.reduce((acc, r) => acc + fn(r), 0);
  const averageAccuracy = sum((r) => r.accuracy) / roundsCount;
  const averageResponseTimeMs = sum((r) => r.response_time_ms) / roundsCount;
  const averageHintsUsed = sum((r) => r.hints_used) / roundsCount;
  const lowEngagementCount = rounds.filter((r) => r.accuracy <= LOW_ENGAGEMENT_ACCURACY_THRESHOLD).length;
  const isLowEngagementStreak = roundsCount === WINDOW_SIZE && lowEngagementCount === WINDOW_SIZE;

  // trend: compare the newest round's accuracy against the average of the rest of the window
  let trend = "stable";
  if (roundsCount >= 2) {
    const [newest, ...rest] = rounds; // rounds[0] is most recent
    const restAvg = rest.reduce((acc, r) => acc + r.accuracy, 0) / rest.length;
    if (newest.accuracy > restAvg + 0.1) trend = "improving";
    else if (newest.accuracy < restAvg - 0.1) trend = "declining";
  }

  return {
    roundsCount,
    averageAccuracy,
    averageResponseTimeMs,
    averageHintsUsed,
    lowEngagementCount,
    isLowEngagementStreak,
    trend,
  };
}

function notify(patientId, gameType) {
  const key = keyFor(patientId, gameType);
  const subs = subscribers.get(key);
  if (!subs || subs.size === 0) return;
  const stats = computeStats(windows.get(key) || []);
  subs.forEach((cb) => cb(stats));
}

/**
 * Seed the rolling window for a patient/game_type from an external source
 * (e.g. Person 1's local storage) — call once when a game or dashboard mounts,
 * before any new rounds are recorded this session.
 * @param {string} patientId
 * @param {"memory"|"attention"|"recall"|"pattern"} gameType
 * @param {GameSession[]} sessions — any order; only the 5 most recent (by timestamp) are kept
 */
export function hydrate(patientId, gameType, sessions) {
  assertGameType(gameType);
  const sorted = [...sessions]
    .filter((s) => s.game_type === gameType && s.patient_id === patientId)
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
    .slice(0, WINDOW_SIZE);
  windows.set(keyFor(patientId, gameType), sorted);
  notify(patientId, gameType);
}

/**
 * Record a newly completed round. Call this right after saveSession()
 * so the rolling window and the durable store stay in sync.
 * @param {string} patientId
 * @param {"memory"|"attention"|"recall"|"pattern"} gameType
 * @param {GameSession} session
 * @returns {RollingStats} updated stats for this patient/game_type
 */
export function recordRound(patientId, gameType, session) {
  assertGameType(gameType);
  const key = keyFor(patientId, gameType);
  const current = windows.get(key) || [];
  const withTimestamp = { timestamp: new Date().toISOString(), ...session };
  const updated = [withTimestamp, ...current].slice(0, WINDOW_SIZE);
  windows.set(key, updated);
  notify(patientId, gameType);
  return computeStats(updated);
}

/**
 * @param {string} patientId
 * @param {"memory"|"attention"|"recall"|"pattern"} gameType
 * @returns {GameSession[]} up to 5 rounds, most recent first
 */
export function getRecentRounds(patientId, gameType) {
  assertGameType(gameType);
  return [...(windows.get(keyFor(patientId, gameType)) || [])];
}

/**
 * Returns the patient's recent rounds across all game types, most recent first.
 * Reuses each game's existing rolling window rather than issuing another session query.
 * @param {string} patientId
 * @returns {GameSession[]}
 */
export function getRecentRoundsAcrossGames(patientId) {
  return VALID_GAME_TYPES
    .flatMap((gameType) => getRecentRounds(patientId, gameType))
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
    .slice(0, WINDOW_SIZE);
}

/**
 * @param {string} patientId
 * @param {"memory"|"attention"|"recall"|"pattern"} gameType
 * @returns {RollingStats}
 */
export function getRollingStats(patientId, gameType) {
  assertGameType(gameType);
  return computeStats(windows.get(keyFor(patientId, gameType)) || []);
}

/**
 * Subscribe to live updates for a patient/game_type window (e.g. for a
 * dashboard widget that shouldn't have to poll). Returns an unsubscribe fn.
 * @param {string} patientId
 * @param {"memory"|"attention"|"recall"|"pattern"} gameType
 * @param {(stats: RollingStats) => void} callback
 * @returns {() => void}
 */
export function subscribe(patientId, gameType, callback) {
  const key = keyFor(patientId, gameType);
  if (!subscribers.has(key)) subscribers.set(key, new Set());
  subscribers.get(key).add(callback);
  return () => subscribers.get(key)?.delete(callback);
}

/**
 * Rolling stats across ALL four game types for a patient, combined.
 * Useful for cross-game signals (e.g. the comfort de-escalation trigger,
 * which cares about low engagement regardless of which game it happened in)
 * rather than per-game_type accuracy trends.
 * @param {string} patientId
 * @returns {RollingStats}
 */
export function getRollingStatsAcrossGames(patientId) {
  const allRounds = VALID_GAME_TYPES.flatMap((gt) => windows.get(keyFor(patientId, gt)) || []);
  const sorted = allRounds
    .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
    .slice(0, WINDOW_SIZE);
  return computeStats(sorted);
}

/** Clears all windows for a patient (all game types). Mainly for tests/demos. */
export function resetPatient(patientId) {
  VALID_GAME_TYPES.forEach((gt) => windows.delete(keyFor(patientId, gt)));
}

export const __constants = { WINDOW_SIZE, LOW_ENGAGEMENT_ACCURACY_THRESHOLD, VALID_GAME_TYPES };
