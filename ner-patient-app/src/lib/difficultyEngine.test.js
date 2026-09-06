/**
 * difficultyEngine.test.js
 * Person 4 (Mokshita) — SIH26003
 *
 * Lightweight assert-based tests, no framework needed.
 * Run with: node difficultyEngine.test.js
 *
 * Mirrors the same harness used in comfortEngine.test.js.
 */
import assert from "node:assert/strict";
import {
  getCurrentTier,
  updateTierAfterSession,
  hydrate,
  getLastChangeInfo,
  resetPatient,
  __constants,
} from "./difficultyEngine.js";
import { resetPatient as resetTracker } from "./performanceTracker.js";

const { DEFAULT_TIER, MIN_TIER, MAX_TIER, HARDER_THRESHOLD, EASIER_THRESHOLD } =
  __constants;

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`✗ ${name}`);
    console.error(`  ${e.message}`);
    process.exitCode = 1;
  }
}

// ---- Helpers ---------------------------------------------------------------

let patientSeq = 0;
/** Returns a unique patient ID so each test gets a clean slate. */
function freshPatient() {
  return `test-patient-${++patientSeq}`;
}

/** Wipe both the difficulty engine and the performance tracker for a patient. */
function cleanUp(patientId) {
  resetPatient(patientId);
  resetTracker(patientId);
}

function fakeSession({
  accuracy = 0.8,
  hints_used = 0,
  game_type = "memory",
  difficulty_tier = DEFAULT_TIER,
} = {}) {
  return {
    id: crypto.randomUUID(),
    patient_id: "placeholder", // overwritten by each test
    game_type,
    timestamp: new Date().toISOString(),
    accuracy,
    response_time_ms: 2000,
    hints_used,
    difficulty_tier,
  };
}

/**
 * Feed `count` identical sessions into the engine for one patient/gameType.
 * Returns the tier after the last session.
 */
function runSessions(patientId, gameType, sessionOverrides, count = 1) {
  let tier;
  for (let i = 0; i < count; i++) {
    tier = updateTierAfterSession(
      patientId,
      gameType,
      fakeSession({ ...sessionOverrides, game_type: gameType })
    );
  }
  return tier;
}

/**
 * Convenience: run sessions then clean up.
 * Use when you only need the final tier and don't need further assertions
 * on the same patient.
 */
function runAndClean(patientId, gameType, overrides, count = 1) {
  const tier = runSessions(patientId, gameType, overrides, count);
  cleanUp(patientId);
  return tier;
}

// ---- Default tier ----------------------------------------------------------

test("fresh patient starts at DEFAULT_TIER (2)", () => {
  const pid = freshPatient();
  assert.equal(getCurrentTier(pid, "memory"), DEFAULT_TIER);
});

test("getCurrentTier for every valid game_type defaults to 2", () => {
  const pid = freshPatient();
  for (const gt of ["memory", "attention", "recall", "pattern"]) {
    assert.equal(getCurrentTier(pid, gt), DEFAULT_TIER);
  }
});

// ---- Escalation (tier UP) --------------------------------------------------

test("5 high-accuracy sessions (>80%) escalates tier step-by-step, capped at MAX_TIER", () => {
  const pid = freshPatient();
  // Each round's rolling avg (0.95) exceeds 0.8, so tier increments each time.
  // Starting at 2: rounds 1-3 push to 5 (clamped), rounds 4-5 stay at 5.
  const tier = runSessions(pid, "memory", { accuracy: 0.95 }, 5);
  assert.equal(tier, MAX_TIER);
  cleanUp(pid);
});

test("escalation: tier does not exceed MAX_TIER (5)", () => {
  const pid = freshPatient();
  hydrate(pid, { memory: MAX_TIER, attention: DEFAULT_TIER, recall: DEFAULT_TIER, pattern: DEFAULT_TIER });
  // Feed enough high-accuracy sessions to try to push past 5
  runSessions(pid, "memory", { accuracy: 0.99 }, 5);
  assert.equal(getCurrentTier(pid, "memory"), MAX_TIER);
  cleanUp(pid);
});

test("after escalation, lastChangeInfo.reason === 'harder'", () => {
  const pid = freshPatient();
  runSessions(pid, "attention", { accuracy: 0.99 }, 5);
  const info = getLastChangeInfo(pid, "attention");
  assert.equal(info.reason, "harder");
  cleanUp(pid);
});

// ---- De-escalation (tier DOWN) --------------------------------------------

test("5 low-accuracy sessions (<40%) de-escalates tier by 1", () => {
  const pid = freshPatient();
  const tier = runSessions(pid, "memory", { accuracy: 0.1 }, 5);
  assert.equal(tier, DEFAULT_TIER - 1);
  cleanUp(pid);
});

test("de-escalation: tier does not fall below MIN_TIER (1)", () => {
  const pid = freshPatient();
  hydrate(pid, { memory: MIN_TIER, attention: DEFAULT_TIER, recall: DEFAULT_TIER, pattern: DEFAULT_TIER });
  runSessions(pid, "memory", { accuracy: 0.05 }, 5);
  assert.equal(getCurrentTier(pid, "memory"), MIN_TIER);
  cleanUp(pid);
});

test("after de-escalation, lastChangeInfo.reason === 'easier'", () => {
  const pid = freshPatient();
  runSessions(pid, "pattern", { accuracy: 0.05 }, 5);
  const info = getLastChangeInfo(pid, "pattern");
  assert.equal(info.reason, "easier");
  cleanUp(pid);
});

// ---- Hold (no change) ------------------------------------------------------

test("mid-range accuracy (40-80%) keeps tier at HOLD", () => {
  const pid = freshPatient();
  const tier = runSessions(pid, "memory", { accuracy: 0.6 }, 5);
  assert.equal(tier, DEFAULT_TIER);
  cleanUp(pid);
});

test("after hold, lastChangeInfo.reason === 'hold'", () => {
  const pid = freshPatient();
  runSessions(pid, "memory", { accuracy: 0.6 }, 5);
  const info = getLastChangeInfo(pid, "memory");
  assert.equal(info.reason, "hold");
  cleanUp(pid);
});

test("boundary: accuracy exactly at HARDER_THRESHOLD (0.8) does NOT escalate", () => {
  // Rule is strict >; a single round at exactly 0.8 must NOT bump the tier.
  const pid = freshPatient();
  runSessions(pid, "memory", { accuracy: HARDER_THRESHOLD }, 1);
  assert.equal(getCurrentTier(pid, "memory"), DEFAULT_TIER);
  cleanUp(pid);
});

test("boundary: accuracy exactly at EASIER_THRESHOLD (0.4) does NOT de-escalate", () => {
  // Rule is strict <; equality should hold.
  const pid = freshPatient();
  runSessions(pid, "memory", { accuracy: EASIER_THRESHOLD }, 5);
  assert.equal(getCurrentTier(pid, "memory"), DEFAULT_TIER);
  cleanUp(pid);
});

// ---- Rolling window (single early round shouldn't lock in a decision) ------

test("one high-accuracy round then 4 mid-range: rolling average eventually falls to hold", () => {
  const pid = freshPatient();
  // Round 1: avg=1.0 → escalates to tier 3.
  updateTierAfterSession(pid, "memory", fakeSession({ accuracy: 1.0, game_type: "memory" }));
  // Rounds 2-5: avg = (1.0 + 0.6*n)/(1+n) drops below 0.8 once n≥2.
  // After round 2: avg = (1.0+0.6)/2 = 0.8 → hold (strict >)
  // After round 3: avg = (1.0+0.6*2)/3 = 0.733 → hold
  // Tier should stop moving after the 1st round.
  const tierAfterAll = runSessions(pid, "memory", { accuracy: 0.6 }, 4);
  // Tier went up by 1 on round 1, then held — so it's DEFAULT_TIER + 1
  assert.equal(tierAfterAll, DEFAULT_TIER + 1);
  cleanUp(pid);
});

test("mixed sessions: 2 bad then 3 good — recovery prevents further de-escalation", () => {
  const pid = freshPatient();
  // Round 1: avg=0.1 → de-escalates to 1
  // Round 2: avg=(0.1+0.1)/2=0.1 → already at MIN_TIER (1), stays
  // Round 3: avg=(0.1+0.1+0.9)/3=0.37 → still below 0.4 but avg < 0.4: de-esc → MIN_TIER (stays)
  // Round 4: avg=(0.1+0.1+0.9+0.9)/4=0.5 → hold
  // Round 5: avg=(0.1+0.1+0.9+0.9+0.9)/5=0.58 → hold
  // Net effect: tier de-escalated on round 1, then held — final tier = MIN_TIER.
  updateTierAfterSession(pid, "attention", fakeSession({ accuracy: 0.1, game_type: "attention" }));
  updateTierAfterSession(pid, "attention", fakeSession({ accuracy: 0.1, game_type: "attention" }));
  runSessions(pid, "attention", { accuracy: 0.9 }, 3);
  assert.equal(getCurrentTier(pid, "attention"), MIN_TIER);
  cleanUp(pid);
});

// ---- Recall bypass ---------------------------------------------------------

test("updateTierAfterSession with gameType='recall' returns current tier unchanged", () => {
  const pid = freshPatient();
  // Even with very high/low accuracy the tier must not move for recall
  const highResult = updateTierAfterSession(
    pid,
    "recall",
    fakeSession({ accuracy: 1.0, game_type: "recall" })
  );
  assert.equal(highResult, DEFAULT_TIER);

  const lowResult = updateTierAfterSession(
    pid,
    "recall",
    fakeSession({ accuracy: 0.0, game_type: "recall" })
  );
  assert.equal(lowResult, DEFAULT_TIER);
});

test("recall bypass: tier stays pinned even after many sessions", () => {
  const pid = freshPatient();
  runSessions(pid, "recall", { accuracy: 0.99 }, 10);
  assert.equal(getCurrentTier(pid, "recall"), DEFAULT_TIER);
  cleanUp(pid);
});

test("recall bypass does NOT affect other game types on same patient", () => {
  const pid = freshPatient();
  // Force a memory escalation first, then verify recall doesn't disturb it
  runSessions(pid, "memory", { accuracy: 0.99 }, 5);
  const memTier = getCurrentTier(pid, "memory");
  // Now fire recall sessions — tier on memory must stay the same
  runSessions(pid, "recall", { accuracy: 0.0 }, 5);
  assert.equal(getCurrentTier(pid, "memory"), memTier);
  assert.equal(getCurrentTier(pid, "recall"), DEFAULT_TIER);
  cleanUp(pid);
});

// ---- Hydration -------------------------------------------------------------

test("hydrate seeds all four game types correctly", () => {
  const pid = freshPatient();
  hydrate(pid, { memory: 4, attention: 1, recall: 3, pattern: 5 });
  assert.equal(getCurrentTier(pid, "memory"), 4);
  assert.equal(getCurrentTier(pid, "attention"), 1);
  assert.equal(getCurrentTier(pid, "recall"), 3);
  assert.equal(getCurrentTier(pid, "pattern"), 5);
});

test("hydrate clamps out-of-range tier to [1,5]", () => {
  const pid = freshPatient();
  hydrate(pid, { memory: 99, attention: -5, recall: DEFAULT_TIER, pattern: DEFAULT_TIER });
  assert.equal(getCurrentTier(pid, "memory"), MAX_TIER);
  assert.equal(getCurrentTier(pid, "attention"), MIN_TIER);
});

test("hydrate + subsequent session: engine continues from hydrated tier", () => {
  const pid = freshPatient();
  hydrate(pid, { memory: 4, attention: DEFAULT_TIER, recall: DEFAULT_TIER, pattern: DEFAULT_TIER });
  // Push 5 high-accuracy rounds: should escalate from 4 → 5
  runSessions(pid, "memory", { accuracy: 0.99 }, 5);
  assert.equal(getCurrentTier(pid, "memory"), 5);
});

// ---- resetPatient ----------------------------------------------------------

test("resetPatient clears all tiers back to default", () => {
  const pid = freshPatient();
  hydrate(pid, { memory: 5, attention: 5, recall: 5, pattern: 5 });
  resetPatient(pid);
  for (const gt of ["memory", "attention", "recall", "pattern"]) {
    assert.equal(getCurrentTier(pid, gt), DEFAULT_TIER);
  }
});

// ---- lastChangeInfo sanity -------------------------------------------------

test("lastChangeInfo.previousTier and newTier are both valid DifficultyTiers", () => {
  const pid = freshPatient();
  runSessions(pid, "memory", { accuracy: 0.99 }, 5);
  const info = getLastChangeInfo(pid, "memory");
  assert.ok(info.previousTier >= MIN_TIER && info.previousTier <= MAX_TIER);
  assert.ok(info.newTier >= MIN_TIER && info.newTier <= MAX_TIER);
});

test("lastChangeInfo.roundsConsidered is between 1 and 5", () => {
  const pid = freshPatient();
  updateTierAfterSession(pid, "pattern", fakeSession({ accuracy: 0.5, game_type: "pattern" }));
  const info = getLastChangeInfo(pid, "pattern");
  assert.ok(info.roundsConsidered >= 1 && info.roundsConsidered <= 5);
});

test("getLastChangeInfo returns null before any session is played", () => {
  const pid = freshPatient();
  assert.equal(getLastChangeInfo(pid, "memory"), null);
});

// ---------------------------------------------------------------------------

console.log(`\n${passed} test(s) passed.`);
