import { useEffect, useState } from "react";
import FamilyVoiceRecorder from "../familyVoice/FamilyVoiceRecorder";
import FamilyVoiceReminder from "../familyVoice/FamilyVoiceReminder";

export default function FamilyVoiceRecorderTest() {
  const [recordingInfo, setRecordingInfo] = useState(null);
  const [voiceNoteUrl, setVoiceNoteUrl] = useState("");

  useEffect(() => {
    return () => {
      if (voiceNoteUrl) {
        URL.revokeObjectURL(voiceNoteUrl);
      }
    };
  }, [voiceNoteUrl]);

  function handleRecordingReady(audioBlob) {
    if (voiceNoteUrl) {
      URL.revokeObjectURL(voiceNoteUrl);
    }

    if (!audioBlob) {
      setRecordingInfo(null);
      setVoiceNoteUrl("");
      return;
    }

    const recordingUrl = URL.createObjectURL(audioBlob);

    setRecordingInfo({
      mimeType: audioBlob.type,
      sizeBytes: audioBlob.size,
    });

    setVoiceNoteUrl(recordingUrl);
  }

  const testReminder = {
    id: "00000000-0000-0000-0000-000000000002",
    patient_id: "00000000-0000-0000-0000-000000000001",
    type: "medicine",
    time: "20:00",
    recurrence: "daily",
    message: "Hello Rina, it is time to take your medicine.",
    voice_note_url: voiceNoteUrl || null,
  };

  return (
    <main>
      <h1>SAHAY Family Voice Test</h1>

      <FamilyVoiceRecorder
        onRecordingReady={handleRecordingReady}
      />

      {recordingInfo && (
        <section aria-live="polite">
          <h2>Recording ready for upload</h2>

          <p>Format: {recordingInfo.mimeType}</p>

          <p>
            Size:{" "}
            {(recordingInfo.sizeBytes / 1024).toFixed(2)} KB
          </p>
        </section>
      )}

      <hr />

      <FamilyVoiceReminder
        reminder={testReminder}
        languageCode="en"
      />
    </main>
  );
}