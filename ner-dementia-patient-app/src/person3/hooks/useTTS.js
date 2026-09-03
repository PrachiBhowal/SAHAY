import { useCallback, useEffect, useState } from "react";
import { resolveSpeechLanguage } from "../config/voiceLanguages";

export default function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text, lang) => {
    if (!text?.trim()) {
      return;
    }

    if (!("speechSynthesis" in window)) {
      console.error("Text-to-speech is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    const speechLanguage = resolveSpeechLanguage(lang);
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = speechLanguage;

    const availableVoices = window.speechSynthesis.getVoices();

    const matchingVoice = availableVoices.find(
      (voice) =>
        voice.lang.toLowerCase() === speechLanguage.toLowerCase(),
    );

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error("Text-to-speech error:", event.error);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  return {
    speak,
    isSpeaking,
  };
}