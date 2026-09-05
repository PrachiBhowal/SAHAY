import { useState } from "react";
import FamilyVoiceRecorder from "./FamilyVoiceRecorder";
import "./FamilyVoice.css";

export default function FamilyVoiceScreen({ onBack }) {
  const [recording, setRecording] = useState(null);

  return (
    <main className="family-voice-screen">
      <button
        className="family-voice-back"
        type="button"
        onClick={onBack}
      >
        ← Back
      </button>

      <section className="family-voice-card">
        <h1>Family Voice Reminder</h1>

        <p className="family-voice-introduction">
          Record a familiar message that can be attached to a
          patient reminder.
        </p>

        <FamilyVoiceRecorder
          onRecordingReady={setRecording}
        />

        {recording && (
          <p className="family-voice-status" role="status">
            Recording is ready to attach when the reminder upload
            service is connected.
          </p>
        )}
      </section>
    </main>
  );
}