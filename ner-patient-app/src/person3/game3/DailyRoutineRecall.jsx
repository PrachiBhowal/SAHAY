import { useEffect, useRef, useState } from "react";
import VoiceSupportNotice from "../components/VoiceSupportNotice";
import { getDailyRecallPrompt } from "../config/dailyRecallPrompts";
import useASR from "../hooks/useASR";
import useTTS from "../hooks/useTTS";
import {
  hasFallbackPrompt,
  playFallbackPrompt,
} from "../services/fallbackAudioService";
import extractKeywords from "../utils/extractKeywords";
import { getVoiceSupport } from "../utils/voiceSupport";
import { saveSession } from "../../lib/localStorage";
import { getAuthToken } from "../../lib/api";
import { updateTierAfterSession } from "../../lib/difficultyEngine.js";
import { getRecentRoundsAcrossGames } from "../../lib/performanceTracker.js";
import { evaluateSessionsForComfortTrigger } from "../../shared/comfortEngine.js";
import { useComfortTrigger } from "../../shared/ComfortTrigger.jsx";
import "./DailyRoutineRecall.css";

export default function DailyRoutineRecall({ patient, difficultyTier = 2, onTierChange, onComfortReady }) {
  const languageCode = patient?.language_pref || "en";
  const prompt = getDailyRecallPrompt(languageCode);

  const [submittedResponse, setSubmittedResponse] = useState(null);
  const [isFallbackPlaying, setIsFallbackPlaying] =
    useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const sessionStartRef = useRef(Date.now());

  const responseInputRef = useRef(null);

  const { transcript, isListening, startListening } = useASR();
  const { speak, isSpeaking } = useTTS();
  const { asrSupported, ttsSupported } = getVoiceSupport();
  const showComfort = useComfortTrigger() || onComfortReady;

  const keywords = submittedResponse
    ? extractKeywords(submittedResponse, languageCode)
    : [];

  useEffect(() => {
    document.documentElement.lang = languageCode;
  }, [languageCode]);

  useEffect(() => {
    if (transcript && responseInputRef.current) {
      responseInputRef.current.value = transcript;
    }
  }, [transcript]);

  useEffect(() => {
    if (submittedResponse !== null) return undefined;
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartRef.current) / 1000));
    }, 250);
    return () => window.clearInterval(interval);
  }, [submittedResponse]);

  async function handlePlayPrompt() {
    if (hasFallbackPrompt(languageCode)) {
      try {
        setIsFallbackPlaying(true);

        const audio = await playFallbackPrompt(languageCode);

        audio.onended = () => {
          setIsFallbackPlaying(false);
        };

        audio.onerror = () => {
          setIsFallbackPlaying(false);
        };
      } catch (error) {
        console.error("Unable to play fallback prompt:", error);
        setIsFallbackPlaying(false);
      }

      return;
    }

    speak(prompt, languageCode);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const response =
      responseInputRef.current?.value.trim() || "";

    if (!response) {
      responseInputRef.current?.focus();
      return;
    }

    // Build a GameSession per CONTRACTS.md §3. Recall is intentionally
    // unscored, so accuracy is null and recall tier calculation is skipped.
    const session = {
      id: crypto.randomUUID(),
      patient_id: patient.id,
      game_type: "recall",
      timestamp: new Date().toISOString(),
      accuracy: null,
      response_time_ms: Math.round(Date.now() - sessionStartRef.current),
      hints_used: 0,
      difficulty_tier: difficultyTier,
    };

    await saveSession(session);
    const newTier = updateTierAfterSession(patient.id, "recall", session);
    if (onTierChange) onTierChange(newTier);
    const comfortResult = await evaluateSessionsForComfortTrigger({
      patientId: patient.id,
      recentSessions: [session, ...getRecentRoundsAcrossGames(patient.id)]
        .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)),
      apiBaseUrl: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
      authToken: getAuthToken()
    });
    if (comfortResult) showComfort?.(comfortResult);

    setSubmittedResponse(response);
  }

  function handleTryAgain() {
    setSubmittedResponse(null);
    sessionStartRef.current = Date.now();
    setElapsedSeconds(0);
  }

  return (
    <article className="game3-container">
      <h1 className="game3-title screen-title">Daily Routine Recall</h1>

      <p className="game3-introduction">
        Hello {patient?.name || "there"}. Take your time and tell us
        about your day.
      </p>

      <VoiceSupportNotice
        asrSupported={asrSupported}
        ttsSupported={ttsSupported}
      />

      <section className="game3-prompt">
        <h2>{prompt}</h2>
        <p className="game3-timer" aria-live="polite">Time: {elapsedSeconds}s</p>

        <div className="game3-actions">
          <button
            className="game3-button game3-button-secondary"
            type="button"
            onClick={handlePlayPrompt}
            disabled={isSpeaking || isFallbackPlaying}
          >
            {isSpeaking || isFallbackPlaying
              ? "Playing prompt..."
              : "Listen to prompt"}
          </button>
        </div>
      </section>

      {submittedResponse === null ? (
        <form className="game3-form" onSubmit={handleSubmit}>
          <p>You can speak or type your response.</p>

          <div className="game3-actions">
            <button
              className="game3-button game3-button-secondary"
              type="button"
              onClick={startListening}
              disabled={isListening || !asrSupported}
            >
              {isListening
                ? "Listening..."
                : "Speak your answer"}
            </button>
          </div>

          <div>
            <label
              className="game3-label"
              htmlFor="recall-response"
            >
              Your response:
            </label>

            <textarea
              className="game3-response"
              id="recall-response"
              ref={responseInputRef}
              rows="6"
              placeholder="Your response will appear here."
            />
          </div>

          <div className="game3-actions">
            <button className="game3-button" type="submit">
              Save my response
            </button>
          </div>
        </form>
      ) : (
        <section className="game3-complete" aria-live="polite">
          <h2>Thank you for sharing</h2>

          <p>
            Your memory has been saved. There are no right or wrong
            answers.
          </p>

          <h3>Your response</h3>
          <p>{submittedResponse}</p>

          {keywords.length > 0 && (
            <>
              <h3>Remembered details</h3>

              <ul className="game3-keywords">
                {keywords.map((keyword) => (
                  <li className="game3-keyword" key={keyword}>
                    {keyword}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="game3-actions">
            <button
              className="game3-button game3-button-secondary"
              type="button"
              onClick={handleTryAgain}
            >
              Try again
            </button>
          </div>
        </section>
      )}
    </article>
  );
}