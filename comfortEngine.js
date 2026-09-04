/**
 * comfortEngine.js
 * Person 4 (Mokshita) — SIH26003
 *
 * Comfort de-escalation trigger.
 *
 * Fires when either:
 *   (a) 3 consecutive sessions for a patient come back "low engagement", or
 *   (b) the patient/caregiver taps the manual "I'm not okay" button.
 *
 * On fire: logs an AlertLog (per CONTRACTS.md §3/§4) and pulls a comforting
 * MemoryAsset (family photo / voice memory from Person 1, or a music track
 * from Person 2's library) to surface to the patient. The AlertLog write is
 * what makes it show up on Person 6's alerts panel — no separate wiring needed
 * there, they just read GET /patients/:id/alerts.
 *
 * NOTE ON HEURISTIC (flagging, not silently inventing a field):
 * CONTRACTS.md has no `engagement` field on GameSession. Rather than add one,
 * "low engagement" is derived here from existing GameSession fields
 * (accuracy, hints_used). Thresholds are constants below — tune freely,
 * but if the *definition* changes materially, mention it to the team since
 * P6's dashboard analytics also reads GameSession.
 */

// ---- Config (tune here, not scattered through the code) ----------------
export const COMFORT_CONFIG = {
  LOW_ENGAGEMENT_ACCURACY_THRESHOLD: 0.3, // accuracy below this = struggling/disengaged
  LOW_ENGAGEMENT_HINTS_THRESHOLD: 3,      // this many hints used = disengaged, leaning on scaffolding
  CONSECUTIVE_SESSIONS_TO_TRIGGER: 3,     // per CONTRACTS.md spec: "3 low-engagement sessions"
};

// ---- Engagement classification ------------------------------------------

/**
 * @param {GameSession} session
 * @returns {boolean} true if this single session reads as "low engagement"
 */
export function isLowEngagementSession(session) {
  if (!session) return false;
  const { accuracy, hints_used } = session;
  const lowAccuracy = typeof accuracy === "number" && accuracy < COMFORT_CONFIG.LOW_ENGAGEMENT_ACCURACY_THRESHOLD;
  const heavyHints = typeof hints_used === "number" && hints_used >= COMFORT_CONFIG.LOW_ENGAGEMENT_HINTS_THRESHOLD;
  return lowAccuracy || heavyHints;
}

/**
 * Checks the most recent sessions (any game_type — the trigger is patient-level,
 * not per-game) for N-in-a-row low engagement.
 *
 * @param {GameSession[]} recentSessions - should already be sorted, most recent first.
 *   Feed this from Person 4's own rolling performance tracker (last 5/patient/game),
 *   flattened + re-sorted across games, or from GameSession[] returned by
 *   GET /patients/:id/sessions.
 * @returns {boolean}
 */
export function hasConsecutiveLowEngagement(recentSessions) {
  const n = COMFORT_CONFIG.CONSECUTIVE_SESSIONS_TO_TRIGGER;
  if (!Array.isArray(recentSessions) || recentSessions.length < n) return false;
  const lastN = recentSessions.slice(0, n);
  return lastN.every(isLowEngagementSession);
}

// ---- Comfort content selection ------------------------------------------

/**
 * Picks a comforting MemoryAsset to surface. Prefers a family photo or voice
 * memory (Person 1's "Still Useful" recordings / family uploads) over music
 * (Person 2's library), since those tend to be more personally grounding —
 * falls back to whatever's available.
 *
 * @param {MemoryAsset[]} memoryAssets - from GET /patients/:id/memory-assets
 * @returns {MemoryAsset | null}
 */
export function selectComfortContent(memoryAssets) {
  if (!Array.isArray(memoryAssets) || memoryAssets.length === 0) return null;

  const byType = (t) => memoryAssets.filter((a) => a.type === t);
  const photos = byType("photo");
  const voices = byType("voice");
  const music = byType("music");

  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Weighted preference: photo/voice memories first, music as fallback.
  const personalPool = [...photos, ...voices];
  if (personalPool.length > 0) return pickRandom(personalPool);
  if (music.length > 0) return pickRandom(music);
  return null;
}

// ---- API calls -----------------------------------------------------------

/**
 * Fires the trigger: writes an AlertLog and returns a comfort payload.
 * Call this once you've already decided the trigger condition is met
 * (either hasConsecutiveLowEngagement(...) === true, or the manual button
 * was pressed).
 *
 * @param {Object} params
 * @param {string} params.patientId
 * @param {"low_engagement"|"manual_distress"} params.triggerType
 * @param {string} params.apiBaseUrl - e.g. "http://localhost:4000/api"
 * @param {string} params.authToken - Bearer token
 * @returns {Promise<{ alertLog: AlertLog, comfortContent: MemoryAsset | null }>}
 */
export async function fireComfortTrigger({ patientId, triggerType, apiBaseUrl, authToken }) {
  if (!["low_engagement", "manual_distress"].includes(triggerType)) {
    // Guard against silently inventing a new AlertTriggerType value —
    // "missed_session" is Person 5's, not ours to fire.
    throw new Error(`Invalid trigger_type for comfort engine: ${triggerType}`);
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken}`,
  };

  // 1. Log the alert (this is what makes it show up on Person 6's panel)
  const alertRes = await fetch(`${apiBaseUrl}/patients/${patientId}/alerts`, {
    method: "POST",
    headers,
    body: JSON.stringify({ trigger_type: triggerType }),
  });
  if (!alertRes.ok) {
    const err = await safeJson(alertRes);
    throw new Error(`Failed to log AlertLog: ${err?.message || alertRes.statusText}`);
  }
  const alertLog = await alertRes.json();

  // 2. Pull memory assets and pick something comforting
  const assetsRes = await fetch(`${apiBaseUrl}/patients/${patientId}/memory-assets`, {
    method: "GET",
    headers,
  });
  let comfortContent = null;
  if (assetsRes.ok) {
    const memoryAssets = await assetsRes.json();
    comfortContent = selectComfortContent(memoryAssets);
  }
  // If the memory-assets fetch fails, we still return the alertLog — the
  // de-escalation UI can show a generic calming fallback (see ComfortTrigger.jsx).

  return { alertLog, comfortContent };
}

/**
 * Convenience wrapper: call this after every session write. It checks the
 * rolling window and fires the low_engagement trigger if the pattern is met.
 * No-ops (returns null) if the trigger condition isn't met.
 *
 * @param {Object} params
 * @param {string} params.patientId
 * @param {GameSession[]} params.recentSessions - most-recent-first, across all game types
 * @param {string} params.apiBaseUrl
 * @param {string} params.authToken
 * @returns {Promise<{ alertLog: AlertLog, comfortContent: MemoryAsset | null } | null>}
 */
export async function evaluateSessionsForComfortTrigger({ patientId, recentSessions, apiBaseUrl, authToken }) {
  if (!hasConsecutiveLowEngagement(recentSessions)) return null;
  return fireComfortTrigger({ patientId, triggerType: "low_engagement", apiBaseUrl, authToken });
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
