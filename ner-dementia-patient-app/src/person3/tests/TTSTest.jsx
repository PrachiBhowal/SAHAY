import { useState } from "react";
import { voiceLanguages } from "../config/voiceLanguages";
import useTTS from "../hooks/useTTS";

export default function TTSTest() {
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [text, setText] = useState(
    "Good evening. What did you see today?",
  );

  const { speak, isSpeaking } = useTTS();

  function handleSpeak() {
    speak(text, selectedLanguage);
  }

  return (
    <main>
      <h1>SAHAY Multilingual Speech Test</h1>

      <label htmlFor="tts-language">
        Select the patient’s language:
      </label>

      <select
        id="tts-language"
        value={selectedLanguage}
        onChange={(event) =>
          setSelectedLanguage(event.target.value)
        }
      >
        {voiceLanguages.map((language) => (
          <option
            key={language.patientCode}
            value={language.patientCode}
          >
            {language.label}
          </option>
        ))}
      </select>

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
        disabled={isSpeaking || !text.trim()}
      >
        {isSpeaking ? "Speaking..." : "Speak"}
      </button>
    </main>
  );
}