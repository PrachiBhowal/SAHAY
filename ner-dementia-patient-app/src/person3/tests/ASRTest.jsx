import { useState } from "react";
import { voiceLanguages } from "../config/voiceLanguages";
import useASR from "../hooks/useASR";

export default function ASRTest() {
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const { transcript, isListening, startListening } = useASR();

  function handleLanguageChange(event) {
    const languageCode = event.target.value;

    setSelectedLanguage(languageCode);
    document.documentElement.lang = languageCode;
  }

  return (
    <main>
      <h1>SAHAY Multilingual Voice Test</h1>

      <label htmlFor="voice-language">
        Select the patient’s language:
      </label>

      <select
        id="voice-language"
        value={selectedLanguage}
        onChange={handleLanguageChange}
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

      <p>Press the button and speak a short sentence.</p>

      <button
        type="button"
        onClick={startListening}
        disabled={isListening}
      >
        {isListening ? "Listening..." : "Start speaking"}
      </button>

      <section aria-live="polite">
        <h2>Transcript</h2>

        <p>
          {transcript || "Your spoken words will appear here."}
        </p>
      </section>
    </main>
  );
}