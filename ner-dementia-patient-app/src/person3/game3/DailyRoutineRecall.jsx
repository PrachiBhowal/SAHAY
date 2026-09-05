import { useEffect, useState } from "react";
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

export default function DailyRoutineRecall({ patient }) {
  const languageCode = patient?.language_pref || "en";
  const prompt = getDailyRecallPrompt(languageCode);

  const [response, setResponse] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFallbackPlaying, setIsFallbackPlaying] =
    useState(false);

  const { transcript, isListening, startListening } = useASR();
  const { speak, isSpeaking } = useTTS();
  const { asrSupported, ttsSupported } = getVoiceSupport();

  const keywords = isSubmitted
    ? extractKeywords(response, languageCode)
    : [];

  useEffect(() => {
    document.documentElement.lang = languageCode;
  }, [languageCode]);

  useEffect(() => {
    if (transcript) {
      setResponse(transcript);
    }
  }, [transcript]);

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

    if (!response.trim()) {
      return;
    }

    setIsSubmitted(true);
  }

  function handleTryAgain() {
    setResponse("");
    setIsSubmitted(false);
  }

  return (
    <main>
      <h1>Daily Routine Recall</h1>

      <p>
        Hello {patient?.name || "there"}. Take your time and tell us
        about your day.
      </p>

      <VoiceSupportNotice
        asrSupported={asrSupported}
        ttsSupported={ttsSupported}
      />

      <section>
        <h2>{prompt}</h2>

        <button
          type="button"
          onClick={handlePlayPrompt}
          disabled={isSpeaking || isFallbackPlaying}
        >
          {isSpeaking || isFallbackPlaying
            ? "Playing prompt..."
            : "Listen to prompt"}
        </button>
      </section>

      {!isSubmitted ? (
        <form onSubmit={handleSubmit}>
          <p>You can speak or type your response.</p>

          <button
            type="button"
            onClick={startListening}
            disabled={isListening || !asrSupported}
          >
            {isListening ? "Listening..." : "Speak your answer"}
          </button>

          <div>
            <label htmlFor="recall-response">
              Your response:
            </label>

            <textarea
              id="recall-response"
              value={response}
              onChange={(event) => setResponse(event.target.value)}
              rows="6"
              placeholder="Your response will appear here."
            />
          </div>

          <button
            type="submit"
            disabled={!response.trim()}
          >
            Save my response
          </button>
        </form>
      ) : (
        <section aria-live="polite">
          <h2>Thank you for sharing</h2>

          <p>
            Your memory has been saved. There are no right or wrong
            answers.
          </p>

          <h3>Your response</h3>
          <p>{response}</p>

          {keywords.length > 0 && (
            <>
              <h3>Remembered details</h3>

              <ul>
                {keywords.map((keyword) => (
                  <li key={keyword}>{keyword}</li>
                ))}
              </ul>
            </>
          )}

          <button type="button" onClick={handleTryAgain}>
            Try again
          </button>
        </section>
      )}
    </main>
  );
}