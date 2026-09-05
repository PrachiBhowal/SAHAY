export function getVoiceSupport() {
  const asrSupported = Boolean(
    window.SpeechRecognition || window.webkitSpeechRecognition,
  );

  const ttsSupported =
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;

  return {
    asrSupported,
    ttsSupported,
  };
}