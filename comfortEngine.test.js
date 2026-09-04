/**
 * comfortEngine.test.js
 * Person 4 (Mokshita) — SIH26003
 *
 * Lightweight assert-based tests, no framework needed for hackathon speed.
 * Run with: node comfortEngine.test.js
 */
import assert from "node:assert/strict";
import {
  isLowEngagementSession,
  hasConsecutiveLowEngagement,
  selectComfortContent,
  COMFORT_CONFIG,
} from "./comfortEngine.js";

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

// ---- Fake session factory -------------------------------------------------
function fakeSession({ accuracy = 0.8, hints_used = 0, game_type = "pattern", timestamp = new Date().toISOString() } = {}) {
  return {
    id: crypto.randomUUID(),
    patient_id: "patient-test-1",
    game_type,
    timestamp,
    accuracy,
    response_time_ms: 2000,
    hints_used,
    difficulty_tier: 2,
  };
}

// ---- isLowEngagementSession -----------------------------------------------

test("high accuracy, no hints => NOT low engagement", () => {
  const s = fakeSession({ accuracy: 0.9, hints_used: 0 });
  assert.equal(isLowEngagementSession(s), false);
});

test("low accuracy => low engagement", () => {
  const s = fakeSession({ accuracy: 0.1, hints_used: 0 });
  assert.equal(isLowEngagementSession(s), true);
});

test("high hints_used => low engagement even with ok accuracy", () => {
  const s = fakeSession({ accuracy: 0.7, hints_used: 4 });
  assert.equal(isLowEngagementSession(s), true);
});

test("boundary: accuracy exactly at threshold is NOT low engagement (strict <)", () => {
  const s = fakeSession({ accuracy: COMFORT_CONFIG.LOW_ENGAGEMENT_ACCURACY_THRESHOLD, hints_used: 0 });
  assert.equal(isLowEngagementSession(s), false);
});

test("null/undefined session => false, doesn't throw", () => {
  assert.equal(isLowEngagementSession(null), false);
  assert.equal(isLowEngagementSession(undefined), false);
});

// ---- hasConsecutiveLowEngagement -------------------------------------------

test("3 consecutive low-engagement sessions => triggers", () => {
  const sessions = [
    fakeSession({ accuracy: 0.1 }),
    fakeSession({ accuracy: 0.2 }),
    fakeSession({ hints_used: 5 }),
    fakeSession({ accuracy: 0.9 }), // older, shouldn't matter
  ];
  assert.equal(hasConsecutiveLowEngagement(sessions), true);
});

test("only 2 consecutive low-engagement sessions => does NOT trigger", () => {
  const sessions = [
    fakeSession({ accuracy: 0.1 }),
    fakeSession({ accuracy: 0.2 }),
    fakeSession({ accuracy: 0.9 }), // breaks the streak
    fakeSession({ accuracy: 0.1 }),
  ];
  assert.equal(hasConsecutiveLowEngagement(sessions), false);
});

test("one good session breaks an otherwise-low streak", () => {
  const sessions = [
    fakeSession({ accuracy: 0.1 }),
    fakeSession({ accuracy: 0.9 }), // good session in the middle
    fakeSession({ accuracy: 0.1 }),
  ];
  assert.equal(hasConsecutiveLowEngagement(sessions), false);
});

test("fewer than 3 sessions total => never triggers", () => {
  const sessions = [fakeSession({ accuracy: 0.1 }), fakeSession({ accuracy: 0.1 })];
  assert.equal(hasConsecutiveLowEngagement(sessions), false);
});

test("empty/undefined session list => false, doesn't throw", () => {
  assert.equal(hasConsecutiveLowEngagement([]), false);
  assert.equal(hasConsecutiveLowEngagement(undefined), false);
});

test("mixed game_types still count toward the streak (patient-level, not per-game)", () => {
  const sessions = [
    fakeSession({ accuracy: 0.1, game_type: "memory" }),
    fakeSession({ accuracy: 0.1, game_type: "pattern" }),
    fakeSession({ accuracy: 0.1, game_type: "recall" }),
  ];
  assert.equal(hasConsecutiveLowEngagement(sessions), true);
});

// ---- selectComfortContent --------------------------------------------------

test("prefers photo/voice over music when both available", () => {
  const assets = [
    { id: "1", type: "music", url: "song.mp3" },
    { id: "2", type: "photo", url: "photo.jpg" },
  ];
  let sawPersonal = true;
  for (let i = 0; i < 20; i++) {
    const picked = selectComfortContent(assets);
    if (picked.type === "music") sawPersonal = false;
  }
  assert.equal(sawPersonal, true);
});

test("falls back to music when no photo/voice available", () => {
  const assets = [{ id: "1", type: "music", url: "song.mp3" }];
  const picked = selectComfortContent(assets);
  assert.equal(picked.type, "music");
});

test("empty asset list => null, doesn't throw", () => {
  assert.equal(selectComfortContent([]), null);
  assert.equal(selectComfortContent(undefined), null);
});

console.log(`\n${passed} test(s) passed.`);
