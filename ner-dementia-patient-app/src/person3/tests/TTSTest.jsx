import { useEffect, useState } from "react";
import VoiceSupportNotice from "../components/VoiceSupportNotice";
import {
  dailyRecallPrompts,
  getDailyRecallPrompt,
} from "../config/dailyRecallPrompts";
import {
  resolveSpeechLanguage,
  voiceLanguages,
} from "../config/voiceLanguages";
import useTTS from "../hooks/useTTS";
import {
  hasFallbackPrompt,
  playFallbackPrompt,
} from "../services/fallbackAudioService";
import { getVoiceSupport } from "../utils/voiceSupport";

const testedLanguages = voiceLanguages.filter(
  (language) => dailyRecallPrompts[language.patientCode],
);

export default function TTSTest() {
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [text, setText] = useState(getDailyRecallPrompt("en"));
  const [availableVoices, setAvailableVoices] = useState([]);
  const [isFallbackPlaying, setIsFallbackPlaying] = useState(false);

  const { speak, isSpeaking } = useTTS();
  const { asrSupported, ttsSupported } = getVoiceSupport();

  useEffect(() => {
    if (!ttsSupported) {
      return;
    }

    function loadVoices() {
      setAvailableVoices(window.speechSynthesis.getVoices());
    }

    loadVoices();

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      loadVoices,
    );

    return () => {
      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        loadVoices,
      );
    };
  }, [ttsSupported]);

  const selectedSpeechLanguage =
    resolveSpeechLanguage(selectedLanguage);

  const matchingVoice = availableVoices.find(
    (voice) =>
      voice.lang.toLowerCase() ===
        selectedSpeechLanguage.toLowerCase() ||
      voice.lang
        .toLowerCase()
        .startsWith(`${selectedLanguage.toLowerCase()}-`),
  );

  const fallbackAvailable =
    hasFallbackPrompt(selectedLanguage);

  function handleLanguageChange(event) {
    const languageCode = event.target.value;

    setSelectedLanguage(languageCode);
    setText(getDailyRecallPrompt(languageCode));
    document.documentElement.lang = languageCode;
  }

  async function handleSpeak() {
    if (matchingVoice) {
      speak(text, selectedLanguage);
      return;
    }

    if (!fallbackAvailable) {
      return;
    }

    try {
      setIsFallbackPlaying(true);

      const audio = await playFallbackPrompt(selectedLanguage);

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
  }

  return (
    <main>
      <h1>SAHAY Multilingual Speech Test</h1>

      <VoiceSupportNotice
        asrSupported={asrSupported}
        ttsSupported={ttsSupported}
      />

      <label htmlFor="tts-language">
        Select the patient’s language:
      </label>

      <select
        id="tts-language"
        value={selectedLanguage}
        onChange={handleLanguageChange}
      >
        {testedLanguages.map((language) => (
          <option
            key={language.patientCode}
            value={language.patientCode}
          >
            {language.label}
          </option>
        ))}
      </select>

      <p aria-live="polite">
        Voice status:{" "}
        {matchingVoice
          ? `${matchingVoice.name} (${matchingVoice.lang})`
          : fallbackAvailable
            ? "Prerecorded fallback audio is ready."
            : `No ${selectedSpeechLanguage} voice or fallback is available.`}
      </p>

      <div>
        <label htmlFor="speech-text">
          Text to speak:
        </label>

        <textarea
          id="speech-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows="4"
        />
      </div>

      <button
        type="button"
        onClick={handleSpeak}
        disabled={
          isSpeaking ||
          isFallbackPlaying ||
          !text.trim() ||
          (!matchingVoice && !fallbackAvailable)
        }
      >
        {isSpeaking || isFallbackPlaying
          ? "Speaking..."
          : "Speak"}
      </button>
    </main>
  );
}