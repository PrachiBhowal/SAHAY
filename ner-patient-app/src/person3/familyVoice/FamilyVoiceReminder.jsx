import useTTS from "../hooks/useTTS";
import { getVoiceSupport } from "../utils/voiceSupport";

export default function FamilyVoiceReminder({
  reminder,
  languageCode = "en",
}) {
  const { speak, isSpeaking } = useTTS();
  const { ttsSupported } = getVoiceSupport();

  if (!reminder) {
    return null;
  }

  const reminderType = reminder.type.replaceAll("_", " ");

  function handleSpeakReminder() {
    speak(reminder.message, languageCode);
  }

  return (
    <article>
      <h2>{reminderType} reminder</h2>

      <p>
        <strong>Time:</strong> {reminder.time}
      </p>

      <p>{reminder.message}</p>

      {reminder.voice_note_url ? (
        <section>
          <h3>Message from your family</h3>

          <audio controls src={reminder.voice_note_url}>
            Your browser does not support audio playback.
          </audio>
        </section>
      ) : (
        <section>
          {ttsSupported ? (
            <button
              type="button"
              onClick={handleSpeakReminder}
              disabled={isSpeaking}
            >
              {isSpeaking
                ? "Playing reminder..."
                : "Listen to reminder"}
            </button>
          ) : (
            <p role="alert">
              Audio playback is unavailable. Please read the reminder
              message shown above.
            </p>
          )}
        </section>
      )}
    </article>
  );
}