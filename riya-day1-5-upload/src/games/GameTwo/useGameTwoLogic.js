import { useState, useCallback, useRef, useEffect } from 'react';
import { OBJECT_BANK, DIFFICULTY_CONFIG } from './objectBank';
import { saveSession, getPatientData } from './localStorageStub';
import { getCurrentTier, updateTierAfterSession } from '../../difficulty/difficultyEngineStub';

const GAME_TYPE = 'attention';
// Soft ceiling on attempts per round. Not a "failure" — after this many
// gentle misses, the round quietly rotates to a new one rather than
// letting accuracy shrink toward zero forever. Keeps the no-wrong-answer
// principle while avoiding an oddly endless round.
const MAX_ATTEMPTS_BEFORE_ROTATE = 6;

/**
 * useGameTwoLogic — "Spot what changed" game state machine.
 *
 * Day 4 update: difficulty tier is now resolved from the difficulty
 * engine (difficultyEngineStub.js — swap for Person 4's real module
 * later, same function names) rather than a fixed prop. Pass
 * `difficultyTierOverride` to force a specific tier for testing.
 */
export function useGameTwoLogic({ patientId = null, difficultyTierOverride = null } = {}) {
  const [resolvedPatientId, setResolvedPatientId] = useState(patientId);
  const [difficultyTier, setDifficultyTier] = useState(2);

  const [tiles, setTiles] = useState([]);
  const [changedIndex, setChangedIndex] = useState(null);
  const [foundIndex, setFoundIndex] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [roundKey, setRoundKey] = useState(0);

  const roundStartRef = useRef(null);
  const hintTimerRef = useRef(null);

  // Resolve patient once, then pull their current tier from the
  // difficulty engine (stub or real, same interface either way).
  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      const id = patientId || (await getPatientData()).id;
      if (cancelled) return;
      setResolvedPatientId(id);
      setDifficultyTier(
        difficultyTierOverride ?? getCurrentTier(id, GAME_TYPE)
      );
    }
    resolve();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, difficultyTierOverride]);

  const config = DIFFICULTY_CONFIG[difficultyTier] || DIFFICULTY_CONFIG[2];

  const generateRound = useCallback(() => {
    const gridSize = config.gridSize;
    const base = OBJECT_BANK[Math.floor(Math.random() * OBJECT_BANK.length)];
    const changeAt = Math.floor(Math.random() * gridSize);

    const newTiles = Array.from({ length: gridSize }, (_, i) => ({
      objectId: base.id,
      icon: base.icon,
      label: base.label,
      color: i === changeAt ? base.colorVariants[1] : base.colorVariants[0],
    }));

    setTiles(newTiles);
    setChangedIndex(changeAt);
    setFoundIndex(null);
    setAttempts(0);
    setHintsUsed(0);
    setFeedback(null);
    roundStartRef.current = performance.now();

    clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => {
      setHintsUsed((h) => h + 1);
      setFeedback({
        tone: 'hint',
        message: "No rush — take a closer look, it's one of these.",
      });
    }, config.hintDelayMs);
  }, [config]);

  useEffect(() => {
    if (!resolvedPatientId) return undefined; // wait for patient/tier resolution
    generateRound();
    return () => clearTimeout(hintTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generateRound, roundKey, resolvedPatientId]);

  const logSession = useCallback(
    async (accuracy, responseTimeMs) => {
      const session = {
        id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        patient_id: resolvedPatientId,
        game_type: GAME_TYPE,
        timestamp: new Date().toISOString(),
        accuracy,
        response_time_ms: Math.round(responseTimeMs),
        hints_used: hintsUsed,
        difficulty_tier: difficultyTier,
      };

      await saveSession(session);
      const nextTier = updateTierAfterSession(resolvedPatientId, GAME_TYPE, session);
      setDifficultyTier(nextTier);
      return session;
    },
    [resolvedPatientId, difficultyTier, hintsUsed]
  );

  const tapTile = useCallback(
    (index) => {
      if (foundIndex !== null) return;

      if (index === changedIndex) {
        clearTimeout(hintTimerRef.current);
        const responseTimeMs = performance.now() - roundStartRef.current;
        const totalTaps = attempts + 1;
        const accuracy = 1 / totalTaps;

        setFoundIndex(index);
        setFeedback({
          tone: 'found',
          message: totalTaps === 1 ? 'Nicely spotted!' : 'There it is — you found it.',
        });

        logSession(accuracy, responseTimeMs);
      } else {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);

        if (nextAttempts >= MAX_ATTEMPTS_BEFORE_ROTATE) {
          // Quietly rotate rather than let the patient get stuck. Log a
          // low-accuracy-but-nonzero session so the difficulty engine
          // still sees this round happened.
          clearTimeout(hintTimerRef.current);
          const responseTimeMs = performance.now() - roundStartRef.current;
          setFeedback({
            tone: 'redirect',
            message: "Let's try a fresh one — here's another.",
          });
          logSession(1 / (nextAttempts + 1), responseTimeMs).then(() => {
            setRoundKey((k) => k + 1);
          });
        } else {
          setFeedback({
            tone: 'redirect',
            message: "Not quite — let's look again together.",
          });
        }
      }
    },
    [foundIndex, changedIndex, attempts, logSession]
  );

  const nextRound = useCallback(() => {
    setRoundKey((k) => k + 1);
  }, []);

  return {
    tiles,
    changedIndex,
    foundIndex,
    feedback,
    tapTile,
    nextRound,
    gridSize: config.gridSize,
    difficultyTier,
  };
}
