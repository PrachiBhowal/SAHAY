/**
 * STUB — matches Person 4's documented interface exactly
 * (CONTRACTS.md Section 6):
 *
 *   getCurrentTier(patientId: string, gameType: GameType): DifficultyTier
 *   updateTierAfterSession(patientId, gameType, session): DifficultyTier
 *
 * Lets Game 2 integrate against the real interface today. Once
 * Mokshita ships the real engine, delete this file and repoint the
 * import in useGameTwoLogic.js — nothing else should need to change.
 *
 * This stub implements the same rule Person 4's Day 3 tasks describe
 * (>80% accuracy → harder, <40% → easier, else hold) using an
 * in-memory rolling history, so Game 2 is testable with realistic
 * difficulty movement even before the real engine lands.
 */

const ROLLING_WINDOW = 5;
const history = {}; // { [patientId__gameType]: DifficultyTier[] of recent accuracies }
const tiers = {}; // { [patientId__gameType]: currentTier }

function key(patientId, gameType) {
  return `${patientId}__${gameType}`;
}

export function getCurrentTier(patientId, gameType) {
  const k = key(patientId, gameType);
  return tiers[k] ?? 2; // default starting tier per CONTRACTS.md Section 2
}

export function updateTierAfterSession(patientId, gameType, session) {
  const k = key(patientId, gameType);
  const currentTier = getCurrentTier(patientId, gameType);

  const recent = history[k] || [];
  recent.push(session.accuracy);
  if (recent.length > ROLLING_WINDOW) recent.shift();
  history[k] = recent;

  const avgAccuracy = recent.reduce((a, b) => a + b, 0) / recent.length;

  let nextTier = currentTier;
  if (avgAccuracy > 0.8 && currentTier < 5) nextTier = currentTier + 1;
  else if (avgAccuracy < 0.4 && currentTier > 1) nextTier = currentTier - 1;

  tiers[k] = nextTier;
  return nextTier;
}
