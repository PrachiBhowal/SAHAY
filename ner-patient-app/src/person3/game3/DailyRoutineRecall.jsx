import { useEffect, useRef, useState } from "react";
import VoiceSupportNotice from "../components/VoiceSupportNotice";
import { getDailyRecallPrompt } from "../config/dailyRecallPrompts";
import { voiceLanguages } from "../config/voiceLanguages";
import useASR from "../hooks/useASR";
import useTTS from "../hooks/useTTS";
import {
  hasFallbackPrompt,
  playFallbackPrompt,
} from "../services/fallbackAudioService";
import extractKeywords from "../utils/extractKeywords";
import { getVoiceSupport } from "../utils/voiceSupport";
import "./DailyRoutineRecall.css";

const gameLanguages = voiceLanguages.filter((language) =>
  ["en", "hi", "as"].includes(language.patientCode),
);

export default function DailyRoutineRecall({ patient }) {
  const [languageCode, setLanguageCode] = useState(
    patient?.language_pref || "en",
  );
  const [submittedResponse, setSubmittedResponse] = useState(null);
  const [isFallbackPlaying, setIsFallbackPlaying] =
    useState(false);

  const responseInputRef = useRef(null);

  const prompt = getDailyRecallPrompt(languageCode);

  const { transcript, isListening, startListening } = useASR();
  const { speak, isSpeaking } = useTTS();
  const { asrSupported, ttsSupported } = getVoiceSupport();

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

  function handleLanguageChange(event) {
    const nextLanguage = event.target.value;

    setLanguageCode(nextLanguage);
    setSubmittedResponse(null);

    if (responseInputRef.current) {
      responseInputRef.current.value = "";
    }
  }

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

  function handleSubmit(event) {
    event.preventDefault();

    const response =
      responseInputRef.current?.value.trim() || "";

    if (!response) {
      responseInputRef.current?.focus();
      return;
    }

    setSubmittedResponse(response);
  }

  function handleTryAgain() {
    setSubmittedResponse(null);

    if (responseInputRef.current) {
      responseInputRef.current.value = "";
    }
  }

  return (
    <article className="game3-container">
      <h1 className="game3-title">Daily Routine Recall</h1>

      <p className="game3-introduction">
        Hello {patient?.name || "there"}. Take your time and tell us
        about your day.
      </p>

      <div className="game3-language">
        <label
          className="game3-label"
          htmlFor="game3-language-select"
        >
          Choose your language:
        </label>

        <select
          className="game3-language-select"
          id="game3-language-select"
          value={languageCode}
          onChange={handleLanguageChange}
        >
          {gameLanguages.map((language) => (
            <option
              key={language.patientCode}
              value={language.patientCode}
            >
              {language.label}
            </option>
          ))}
        </select>
      </div>

      <VoiceSupportNotice
        asrSupported={asrSupported}
        ttsSupported={ttsSupported}
      />

      <section className="game3-prompt">
        <h2>{prompt}</h2>

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
              Finish reflection
            </button>
          </div>
        </form>
      ) : (
        <section className="game3-complete" aria-live="polite">
          <h2>Thank you for sharing</h2>

          <p>
            Thank you for sharing. There are no right or wrong
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