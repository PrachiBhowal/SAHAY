import { useCallback, useEffect, useRef, useState } from "react";
import { resolveSpeechLanguage } from "../config/voiceLanguages";

export default function useASR() {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  const isReady = Boolean(SpeechRecognition);

  useEffect(() => {
    if (!SpeechRecognition) {
      console.error("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const spokenText = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");

      setTranscript(spokenText);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [SpeechRecognition]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) {
      return;
    }

    const patientLanguage = document.documentElement.lang || "en";

    recognitionRef.current.lang =
      resolveSpeechLanguage(patientLanguage);

    setTranscript("");
    setIsListening(true);

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error("Unable to start speech recognition:", error);
      setIsListening(false);
    }
  }, [isListening]);

  return {
    transcript,
    isListening,
    isReady,
    startListening,
  };
}