import { useState, useRef } from "react";
import { api } from "../api/client";

const typeLabels = {
  medicine: "Medicine",
  hydration: "Hydration",
  activity: "Activity",
  appointment: "Appointment",
};

const typeColors = {
  medicine: "var(--color-terracotta)",
  hydration: "var(--color-sage)",
  activity: "var(--color-ochre)",
  appointment: "var(--color-brown)",
};

const emptyForm = {
  type: "medicine",
  time: "08:00",
  recurrence: "daily",
  message: "",
  voice_note_url: null,
};

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
export default function RemindersPanel({ patientId, reminders, setReminders }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // Audio recording state
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef(null);

  function openCreateForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(reminder) {
    setForm({
      type: reminder.type,
      time: reminder.time,
      recurrence: reminder.recurrence,
      message: reminder.message,
      voice_note_url: reminder.voice_note_url,
    });
    setEditingId(reminder.id);
    setShowForm(true);
  }

  // Audio recording functions
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingTime(0);
      setIsRecording(true);

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mediaRecorder.mimeType || "audio/webm",
          });
          // blob: URLs only work in the browser that created them. Persist the
          // recording as a data URL so the patient app can play it remotely.
          const dataUrl = await blobToDataUrl(audioBlob);
          setForm((prev) => ({ ...prev, voice_note_url: dataUrl }));
        } catch (error) {
          console.error("Unable to prepare voice note:", error);
          alert("The recording could not be saved. Please try again.");
        } finally {
          setIsRecording(false);
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start();

      // Timer for recording duration
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Please allow microphone access to record voice notes.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  }

  function resetRecording() {
    setForm((prev) => ({ ...prev, voice_note_url: null }));
    setRecordingTime(0);
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  async function handleSave(e) {
    e.preventDefault();
    if (editingId) {
      const updatedReminder = await api.updateReminder(patientId, editingId, form);
      setReminders((prev) => prev.map((r) => (r.id === editingId ? updatedReminder : r)));
    } else {
      const newReminder = await api.createReminder(patientId, form);
      setReminders((prev) => [...prev, newReminder]);
    }
    setShowForm(false);
  }

  function toggleComplete(id) {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed_today: !r.completed_today } : r))
    );
  }

  async function handleDelete(id) {
    await api.deleteReminder(patientId, id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 4px 16px rgba(74,50,38,0.08)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ color: "var(--color-brown)", fontSize: "var(--font-size-lg)", margin: 0 }}>
          Reminders
        </h2>
        <button onClick={openCreateForm} style={styles.addButton}>
          + Add Reminder
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {reminders.map((r) => (
          <div key={r.id} style={styles.row}>
            <div style={{ ...styles.typeTag, background: typeColors[r.type] }}>
              {typeLabels[r.type]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={styles.message}>{r.message}</div>
              <div style={styles.meta}>
                {r.time} · {r.recurrence}
                {r.voice_note_url && <span style={{ marginLeft: 8 }}>🎙️ Voice note attached</span>}
              </div>
            </div>
            <label style={styles.completeLabel}>
              <input
                type="checkbox"
                checked={r.completed_today}
                onChange={() => toggleComplete(r.id)}
                style={{ width: 20, height: 20 }}
              />
              Done today
            </label>
            <button onClick={() => openEditForm(r)} style={styles.iconButton}>
              Edit
            </button>
            <button onClick={() => handleDelete(r.id)} style={{ ...styles.iconButton, color: "var(--color-terracotta)" }}>
              Delete
            </button>
          </div>
        ))}
        {reminders.length === 0 && (
          <p style={{ color: "var(--color-sage)" }}>No reminders yet — add one to get started.</p>
        )}
      </div>

      {showForm && (
        <div style={styles.overlay}>
          <form onSubmit={handleSave} style={styles.formCard}>
            <h3 style={{ color: "var(--color-brown)", marginTop: 0 }}>
              {editingId ? "Edit Reminder" : "New Reminder"}
            </h3>

            <label style={styles.label}>Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              style={styles.input}
            >
              <option value="medicine">Medicine</option>
              <option value="hydration">Hydration</option>
              <option value="activity">Activity</option>
              <option value="appointment">Appointment</option>
            </select>

            <label style={styles.label}>Time</label>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              style={styles.input}
              required
            />

            <label style={styles.label}>Recurrence</label>
            <select
              value={form.recurrence}
              onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
              style={styles.input}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="once">Once</option>
            </select>

            <label style={styles.label}>Message</label>
            <input
              type="text"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              style={styles.input}
              placeholder="e.g. Take morning tablet"
              required
            />

            {/* Voice Recording Section */}
            <div style={styles.voiceSection}>
              <label style={styles.label}>Family Voice Note (Optional)</label>
              <p style={{ color: "var(--color-sage)", fontSize: 13, marginTop: 0 }}>
                Record a personal message from family to play when this reminder is due.
              </p>

              {!form.voice_note_url ? (
                <div style={styles.recordingArea}>
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      style={{ ...styles.recordButton, background: "var(--color-terracotta)" }}
                    >
                      🎙️ Start Recording
                    </button>
                  ) : (
                    <div style={styles.recordingInProgress}>
                      <span style={{ fontSize: 20, animation: "pulse 1s infinite" }}>🔴</span>
                      <span style={styles.recordingTime}>{formatTime(recordingTime)}</span>
                      <button
                        type="button"
                        onClick={stopRecording}
                        style={{ ...styles.recordButton, background: "var(--color-sage)" }}
                      >
                        ⏹ Stop
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={styles.recordingPreview}>
                  <audio controls style={{ width: "100%", marginBottom: 10 }}>
                    <source src={form.voice_note_url} />
                    Your browser does not support the audio element.
                  </audio>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      type="button"
                      onClick={resetRecording}
                      style={{ ...styles.recordButton, flex: 1, background: "var(--color-background)", color: "var(--color-brown)" }}
                    >
                      🔄 Re-record
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button type="submit" style={styles.saveButton}>
                {editingId ? "Save Changes" : "Create Reminder"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} style={styles.cancelButton}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  addButton: {
    background: "var(--color-terracotta)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 18px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "12px 14px",
    background: "var(--color-background)",
    borderRadius: 10,
  },
  typeTag: {
    color: "#fff",
    fontSize: 12,
    fontWeight: 600,
    padding: "6px 10px",
    borderRadius: 6,
    whiteSpace: "nowrap",
  },
  message: { color: "var(--color-charcoal)", fontSize: 16, fontWeight: 600 },
  meta: { color: "var(--color-sage)", fontSize: 13, marginTop: 2 },
  completeLabel: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "var(--color-brown)",
    whiteSpace: "nowrap",
  },
  iconButton: {
    background: "none",
    border: "none",
    color: "var(--color-brown)",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "underline",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(42,33,27,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  formCard: {
    background: "#fff",
    borderRadius: 14,
    padding: 28,
    width: 420,
    maxHeight: "90vh",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  label: { color: "var(--color-brown)", fontWeight: 600, fontSize: 14, marginTop: 10 },
  input: {
    minHeight: 48,
    fontSize: 16,
    padding: "0 12px",
    border: "2px solid var(--color-sage)",
    borderRadius: 8,
    marginTop: 4,
  },
  voiceSection: {
    marginTop: 16,
    padding: "14px 14px",
    background: "var(--color-background)",
    borderRadius: 10,
  },
  recordingArea: {
    display: "flex",
    justifyContent: "center",
    marginTop: 10,
  },
  recordButton: {
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "12px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  recordingInProgress: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    background: "#fff",
    borderRadius: 8,
    border: "2px solid var(--color-terracotta)",
  },
  recordingTime: {
    fontSize: 16,
    fontWeight: 700,
    color: "var(--color-charcoal)",
  },
  recordingPreview: {
    marginTop: 10,
  },
  saveButton: {
    flex: 1,
    minHeight: 48,
    background: "var(--color-terracotta)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
  },
  cancelButton: {
    flex: 1,
    minHeight: 48,
    background: "var(--color-background)",
    color: "var(--color-brown)",
    border: "2px solid var(--color-sage)",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
  },
};