import { useCallback, useEffect, useRef, useState } from "react";
import { resolveSpeechLanguage } from "../config/voiceLanguages";

export default function useASR() {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
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
      // BUG FIX: interimResults=true means this fires on every partial
      // word while the patient is still speaking ("G", "Gra", "Grandma"
      // as three separate events). The old code called setTranscript on
      // every one of those, and Game 1's effect matched on every update —
      // so a round could burn through all its gentle-miss attempts before
      // the patient finished a single word. Only commit the transcript
      // once a result is marked final; interim text is used for live
      // captioning only, never for matching an answer.
      const results = Array.from(event.results);
      const isFinal = results.some((result) => result.isFinal);
      const spokenText = results.map((result) => result[0].transcript).join("");

      setInterimTranscript(spokenText);
      if (isFinal) {
        setTranscript(spokenText);
      }
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

  const startListening = useCallback((languageCode) => {
    if (!recognitionRef.current || isListening) {
      return;
    }

    // BUG FIX: document.documentElement.lang was only ever set inside
    // Game 3 (DailyRoutineRecall.jsx). Any other screen — including
    // Game 1's voice-recall mode — silently listened in English for a
    // patient whose language_pref is Assamese/Bodo/Khasi/etc. unless
    // Game 3 happened to run first in that session. Callers should now
    // pass the patient's actual language_pref explicitly; the document
    // attribute is kept only as a last-resort fallback.
    const patientLanguage = languageCode || document.documentElement.lang || "en";

    recognitionRef.current.lang = resolveSpeechLanguage(patientLanguage);

    setTranscript("");
    setInterimTranscript("");
    setIsListening(true);

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error("Unable to start speech recognition:", error);
      setIsListening(false);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    isReady,
    startListening,
    stopListening,
  };
}