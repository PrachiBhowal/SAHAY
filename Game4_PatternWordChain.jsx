import { useState, useRef, useCallback, useEffect } from "react";
import { CLUE_BANK } from "./clueBank.js";
import { getRecentRounds, subscribe as subscribeToRounds } from "./performanceTracker.js";
import { getCurrentTier, updateTierAfterSession } from "./difficultyEngine.js";
import { saveSession } from "./ner-patient-app/src/lib/localStorage.js";

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

export default function Game4PatternWordChain({ patientId = DEMO_PATIENT_ID }) {
  const [tier, setTier] = useState(() => getCurrentTier(patientId, "pattern"));
  const [order] = useState(() => shuffle(CLUE_BANK));
  const [roundIdx, setRoundIdx] = useState(0);
  const [round, setRound] = useState(() => buildRound(order[0], tier));
  const [cluesShown, setCluesShown] = useState(1);
  const [phase, setPhase] = useState("playing"); // playing | correct | wrong | sessionDone
  const [selected, setSelected] = useState(null);
  const [log, setLog] = useState(() => getRecentRounds(patientId, "pattern"));
  const startTimeRef = useRef(Date.now());

  // In a real deploy, seed the window from Person 1's local storage here, e.g.:
  //   getPatientData().then(({ sessions }) => hydrate(patientId, "pattern", sessions));
  // For now there's nothing to hydrate from, so this just subscribes to live
  // updates so the "Recent rounds" list stays in sync with the shared tracker
  // even if something else (another tab, the difficulty engine) touches it.
  useEffect(() => {
    const unsubscribe = subscribeToRounds(patientId, "pattern", (stats) => {
      setLog(getRecentRounds(patientId, "pattern"));
    });
    return unsubscribe;
  }, [patientId]);

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
    const accuracy = isCorrect ? Math.max(0, (TOTAL_CLUES - hintsUsed) / TOTAL_CLUES) : 0;

    setPhase(isCorrect ? "correct" : "wrong");

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
    // updateTierAfterSession calls performanceTracker.recordRound() internally,
    // so the rolling window and "Recent rounds" list (via the subscription above)
    // update as a side effect of this one call.
    const newTier = updateTierAfterSession(patientId, "pattern", { ...session, object: round.object, correct: isCorrect });
    setTier(newTier);

    // brief pause on feedback, then advance
    setTimeout(() => {
      const nextIdx = roundIdx + 1;
      setRoundIdx(nextIdx);
      startNewRound(nextIdx, newTier);
    }, isCorrect ? 1400 : 2200);
  };

  const restartSession = () => {
    setRoundIdx(0);
    // Recent-rounds history intentionally persists across a restart — it's
    // the patient's rolling performance, not this component's local state.
    startNewRound(0, tier);
  };

  return (
    <div className="g4-root">
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
        .g4-option.wrong { background: #B5533C; }
        .g4-option:disabled { cursor: default; }
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
              else if (selected === opt && opt !== round.object) cls += " wrong";
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
          {phase === "wrong" && (
            <p className="g4-feedback">Good try — it was a {round.object}.</p>
          )}

          <p className="g4-progress">
            Round {roundIdx + 1} of {order.length}
          </p>
        </div>
      )}

      {log.length > 0 && (
        <div className="g4-log">
          <p className="g4-log-title">Recent rounds</p>
          {log.map((r, i) => (
            <div className="g4-log-row" key={i}>
              <span>{r.object}</span>
              <span>
                {r.correct ? "✓" : "✗"} · {r.hints_used} hint{r.hints_used === 1 ? "" : "s"} ·{" "}
                {(r.response_time_ms / 1000).toFixed(1)}s
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
