import { useState, useRef, useCallback, useEffect } from "react";
import { CLUE_BANK } from "./clueBank.js";
import {
  getRecentRounds,
  getRecentRoundsAcrossGames,
  subscribe as subscribeToRounds,
} from "../lib/performanceTracker.js";
import { getCurrentTier, hydrate, updateTierAfterSession } from "../lib/difficultyEngine.js";
import { saveSession } from "../lib/localStorage.js";
import { getPatientData } from "../lib/localStorage.js";
import { evaluateSessionsForComfortTrigger } from "./comfortEngine.js";
import { useComfortTrigger } from "./ComfortTrigger.jsx";
import Countdown from "./Countdown.jsx";

/* ============================================================
   GAME 4 — Pattern / Word-Chain Recognition
   Owner: Person 4 (Mokshita)

   Contract notes (see CONTRACTS.md):
   - game_type: "pattern"
   - GameSession fields logged: accuracy, response_time_ms,
     hints_used, difficulty_tier
   - This file includes a PLACEHOLDER for the Person 1 storage call
     (saveSession) only — swap it for the real import once that module
     lands, the signature already matches CONTRACTS.md section 6.
   - getCurrentTier / updateTierAfterSession are the REAL shared
     difficulty engine (./difficultyEngine.js), not a local stub.
     updateTierAfterSession calls performanceTracker.recordRound()
     internally, so this file does NOT call recordRound() itself.
   - CLUE_BANK is imported from ./clueBank.js (40 objects x 5 clues,
     vague -> specific, each with 3 distractors). Extend that file,
     not this one, when adding more objects.
   - "Recent rounds" below is backed by the shared rolling
     performance tracker (./performanceTracker.js), not local
     component state — every game reads/writes the same window
     per (patientId, game_type).
   ============================================================ */

const DEMO_PATIENT_ID = "demo-patient-001";

const TOTAL_CLUES = 5;

// Difficulty tier controls how many multiple-choice options are shown.
// Lower tier = fewer, more obvious options. Higher tier = more, closer options.
// Every object in clueBank.js now carries 3 distractors, so this scales to 4 total options.
function optionCountForTier(tier) {
  if (tier <= 2) return 2;
  if (tier === 3) return 3;
  return 4; // tiers 4-5: hardest, most options to tell apart
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRound(item, tier) {
  const n = optionCountForTier(tier);
  const options = shuffle([item.object, ...item.distractors.slice(0, n - 1)]);
  return { ...item, options };
}

export default function Game4PatternWordChain({ patientId = DEMO_PATIENT_ID, onBack, onComfortReady }) {
  const [tier, setTier] = useState(2);
  const [order] = useState(() => shuffle(CLUE_BANK));
  const [roundIdx, setRoundIdx] = useState(0);
  const [round, setRound] = useState(() => buildRound(order[0], tier));
  const [cluesShown, setCluesShown] = useState(1);
  const [phase, setPhase] = useState("countdown"); // countdown | playing | correct | wrong | sessionDone
  const [selected, setSelected] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [log, setLog] = useState(() => getRecentRounds(patientId, "pattern"));
  const startTimeRef = useRef(Date.now());
  const showComfort = useComfortTrigger() || onComfortReady;

  useEffect(() => {
    getPatientData().then((patient) => {
      if (!patient || patient.id !== patientId) return;
      hydrate(patient.id, patient.difficulty_tiers);
      setTier(getCurrentTier(patient.id, "pattern"));
    });

    const unsubscribe = subscribeToRounds(patientId, "pattern", () => {
      setLog(getRecentRounds(patientId, "pattern"));
    });
    return unsubscribe;
  }, [patientId]);

  useEffect(() => {
    if (phase !== "playing") return undefined;
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 250);
    return () => window.clearInterval(interval);
  }, [phase]);

  const startNewRound = useCallback(
    (nextIdx, nextTier) => {
      if (nextIdx >= order.length) {
        setPhase("sessionDone");
        return;
      }
      setRound(buildRound(order[nextIdx], nextTier));
      setCluesShown(1);
      setSelected(null);
      setPhase("playing");
      setElapsedSeconds(0);
      startTimeRef.current = Date.now();
    },
    [order]
  );

  const revealNextClue = () => {
    if (cluesShown < TOTAL_CLUES) setCluesShown((c) => c + 1);
  };

  const handleGuess = async (choice) => {
    if (phase !== "playing") return;
    setSelected(choice);
    const isCorrect = choice === round.object;
    const responseTimeMs = Date.now() - startTimeRef.current;
    const hintsUsed = cluesShown - 1; // clues seen before this guess, beyond the first
    // BUG FIX: was a hard 0 on a miss, which violates the project-wide
    // "accuracy is never zero" rule (see Game 2's own README) and now
    // also violates the game_sessions.accuracy CHECK constraint added to
    // schema.sql (accuracy > 0) — inserts for a missed round would start
    // failing /sync silently otherwise. Guided (non-correct) rounds now
    // log a small positive floor instead.
    const accuracy = isCorrect ? Math.max(0.2, (TOTAL_CLUES - hintsUsed) / TOTAL_CLUES) : 0.2;

    setPhase(isCorrect ? "correct" : "guided");

    const session = {
      id: crypto.randomUUID(),
      patient_id: patientId,
      game_type: "pattern",
      timestamp: new Date().toISOString(),
      accuracy,
      response_time_ms: responseTimeMs,
      hints_used: hintsUsed,
      difficulty_tier: tier,
    };

    await saveSession(session);
    // updateTierAfterSession calls performanceTracker.recordRound() internally
    const newTier = updateTierAfterSession(patientId, "pattern", { ...session, object: round.object, correct: isCorrect });
    setTier(newTier);
    const comfortResult = await evaluateSessionsForComfortTrigger({
      patientId,
      recentSessions: getRecentRoundsAcrossGames(patientId),
      apiBaseUrl: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
      authToken: window.localStorage.getItem("sahay_patient_auth_token") || undefined
    });
    if (comfortResult) showComfort?.(comfortResult);

    // brief pause on feedback, then advance
    setTimeout(() => {
      const nextIdx = roundIdx + 1;
      setRoundIdx(nextIdx);
      startNewRound(nextIdx, newTier);
    }, isCorrect ? 1400 : 2000);
  };


  const restartSession = () => {
    setRoundIdx(0);
    // Recent-rounds history intentionally persists across a restart — it's
    // the patient's rolling performance, not this component's local state.
    setPhase("countdown");
  };

  return (
    <div className="g4-root">
      {phase === "countdown" && (
        <Countdown
          seconds={5}
          onComplete={() => startNewRound(roundIdx, tier)}
          onCancel={onBack}
        />
      )}
      <style>{`
        .g4-root {
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

          font-family: 'Segoe UI', 'Century Gothic', system-ui, -apple-system, sans-serif;
          background: var(--color-background);
          color: var(--color-text);
          min-height: 100%;
          padding: calc(var(--spacing-unit) * 4);
          border-radius: 20px;
          box-sizing: border-box;
        }
        .g4-root * { box-sizing: border-box; }
        .g4-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: calc(var(--spacing-unit) * 3);
        }
        .g4-title {
          font-size: var(--font-size-xl);
          font-weight: 700;
          margin: 0;
        }
        .g4-tier {
          font-size: var(--font-size-base);
          background: var(--color-sage);
          color: white;
          padding: calc(var(--spacing-unit)) calc(var(--spacing-unit) * 2);
          border-radius: 12px;
          font-weight: 600;
        }
        .g4-card {
          background: white;
          border-radius: 24px;
          padding: calc(var(--spacing-unit) * 4);
          box-shadow: 0 4px 20px rgba(107, 79, 59, 0.08);
        }
        .g4-prompt {
          font-size: var(--font-size-base);
          color: var(--color-brown);
          margin: 0 0 calc(var(--spacing-unit) * 2) 0;
          font-weight: 600;
        }
        .g4-timer {
          color: var(--color-text-muted);
          margin: 0 0 calc(var(--spacing-unit) * 2);
        }
        .g4-clues {
          list-style: none;
          margin: 0 0 calc(var(--spacing-unit) * 3) 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: calc(var(--spacing-unit) * 1.5);
        }
        .g4-clue {
          font-size: var(--font-size-lg);
          line-height: 1.5;
          padding: calc(var(--spacing-unit) * 2);
          border-left: 6px solid var(--color-terracotta);
          background: var(--color-background);
          border-radius: 0 14px 14px 0;
        }
        .g4-clue-num {
          font-size: var(--font-size-base);
          color: var(--color-terracotta);
          font-weight: 700;
          margin-right: calc(var(--spacing-unit));
        }
        .g4-reveal-btn {
          width: 100%;
          min-height: var(--touch-target-min);
          font-size: var(--font-size-lg);
          font-weight: 600;
          border: 2px dashed var(--color-ochre);
          background: transparent;
          color: var(--color-brown);
          border-radius: 16px;
          cursor: pointer;
          margin-bottom: calc(var(--spacing-unit) * 3);
        }
        .g4-reveal-btn:disabled {
          opacity: 0.4;
          cursor: default;
        }
        .g4-options {
          display: grid;
          grid-template-columns: 1fr;
          gap: calc(var(--spacing-unit) * 2);
        }
        .g4-option {
          min-height: var(--touch-target-min);
          font-size: var(--font-size-lg);
          font-weight: 600;
          border: none;
          border-radius: 16px;
          background: var(--color-terracotta);
          color: white;
          cursor: pointer;
          padding: calc(var(--spacing-unit) * 2);
          transition: transform 0.15s ease;
        }
        .g4-option:active { transform: scale(0.97); }
        .g4-option.correct { background: var(--color-sage); }
        .g4-option.guided { background: var(--color-ochre); color: var(--color-text); }
        .g4-option:disabled { cursor: default; }
        .g4-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 52px;
          padding: 0 18px;
          background: var(--color-surface);
          border: 2px solid var(--color-border-strong);
          border-radius: 26px;
          color: var(--color-brown);
          font-size: calc(16px * var(--font-scale, 1));
          font-weight: 700;
          cursor: pointer;
          margin-bottom: calc(var(--spacing-unit) * 2);
          transition: background 0.15s ease, transform 0.1s ease;
        }
        .g4-back:active {
          transform: scale(0.96);
          background: var(--color-background);
        }

        .g4-feedback {
          text-align: center;
          font-size: var(--font-size-lg);
          font-weight: 700;
          margin-top: calc(var(--spacing-unit) * 3);
          color: var(--color-brown);
        }
        .g4-progress {
          font-size: var(--font-size-base);
          color: var(--color-brown);
          opacity: 0.7;
          margin-top: calc(var(--spacing-unit) * 3);
          text-align: center;
        }
        .g4-log {
          margin-top: calc(var(--spacing-unit) * 4);
          font-size: var(--font-size-base);
        }
        .g4-log-title {
          font-weight: 700;
          margin-bottom: calc(var(--spacing-unit));
        }
        .g4-log-row {
          display: flex;
          justify-content: space-between;
          padding: calc(var(--spacing-unit)) 0;
          border-bottom: 1px solid #eee2d3;
        }
        .g4-done {
          text-align: center;
          padding: calc(var(--spacing-unit) * 4);
        }
        .g4-restart {
          min-height: var(--touch-target-min);
          font-size: var(--font-size-lg);
          font-weight: 700;
          background: var(--color-sage);
          color: white;
          border: none;
          border-radius: 16px;
          padding: calc(var(--spacing-unit) * 2) calc(var(--spacing-unit) * 4);
          cursor: pointer;
          margin-top: calc(var(--spacing-unit) * 3);
        }
      `}</style>

      {onBack && <button className="g4-back" onClick={onBack}>← Back</button>}
      <div className="g4-header">
        <h1 className="g4-title">What is it?</h1>
        <span className="g4-tier">Level {tier}</span>
      </div>

      {phase === "sessionDone" ? (
        <div className="g4-card g4-done">
          <p className="g4-prompt" style={{ fontSize: "var(--font-size-lg)" }}>
            That's every round for now — well done!
          </p>
          <button className="g4-restart" onClick={restartSession}>
            Play again
          </button>
        </div>
      ) : (
        <div className="g4-card">
          <p className="g4-prompt">Listen to the clues, then choose the object.</p>
          <p className="g4-timer" aria-live="polite">Time: {elapsedSeconds}s</p>

          <ol className="g4-clues">
            {round.clues.slice(0, cluesShown).map((clue, i) => (
              <li className="g4-clue" key={i}>
                <span className="g4-clue-num">{i + 1}.</span>
                {clue}
              </li>
            ))}
          </ol>

          <button
            className="g4-reveal-btn"
            onClick={revealNextClue}
            disabled={cluesShown >= TOTAL_CLUES || phase !== "playing"}
          >
            {cluesShown >= TOTAL_CLUES ? "All clues shown" : "Show another clue"}
          </button>

          <div className="g4-options">
            {round.options.map((opt) => {
              let cls = "g4-option";
              if (selected && opt === round.object) cls += " correct";
              else if (selected === opt && opt !== round.object) cls += " guided";
              return (
                <button
                  key={opt}
                  className={cls}
                  disabled={phase !== "playing"}
                  onClick={() => handleGuess(opt)}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {phase === "correct" && <p className="g4-feedback">That's right — it's a {round.object}!</p>}
          {phase === "guided" && (
            <p className="g4-feedback">A wonderful thought! The clues were pointing to the {round.object}.</p>
          )}

          <p className="g4-progress">
            Round {roundIdx + 1} of {order.length}
          </p>
        </div>
      )}

      <div className="g4-gentle-encouragement">
        <p style={{ margin: '16px 0 0', color: 'var(--color-sage)', textAlign: 'center', fontSize: '15px' }}>
          Take all the time you need. Every thought is valued.
        </p>
      </div>
    </div>
  );
}

