import { useState } from "react";

const initialReminders = [
  {
    id: "r1",
    patient_id: "p1",
    type: "medicine",
    time: "08:00",
    recurrence: "daily",
    message: "Take morning blood pressure tablet",
    voice_note_url: null,
    completed_today: true,
  },
  {
    id: "r2",
    patient_id: "p1",
    type: "hydration",
    time: "11:00",
    recurrence: "daily",
    message: "Drink a glass of water",
    voice_note_url: null,
    completed_today: false,
  },
  {
    id: "r3",
    patient_id: "p1",
    type: "appointment",
    time: "16:30",
    recurrence: "once",
    message: "Visit ASHA worker for weekly check-in",
    voice_note_url: null,
    completed_today: false,
  },
];

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
};

export default function RemindersPanel() {
  const [reminders, setReminders] = useState(initialReminders);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

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
    });
    setEditingId(reminder.id);
    setShowForm(true);
  }

  function handleSave(e) {
    e.preventDefault();
    if (editingId) {
      setReminders((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, ...form } : r))
      );
    } else {
      const newReminder = {
        id: `r${Date.now()}`,
        patient_id: "p1",
        voice_note_url: null,
        completed_today: false,
        ...form,
      };
      setReminders((prev) => [...prev, newReminder]);
    }
    setShowForm(false);
  }

  function toggleComplete(id) {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed_today: !r.completed_today } : r))
    );
  }

  function handleDelete(id) {
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
            <div
              style={{
                ...styles.typeTag,
                background: typeColors[r.type],
              }}
            >
              {typeLabels[r.type]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={styles.message}>{r.message}</div>
              <div style={styles.meta}>
                {r.time} · {r.recurrence}
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
    width: 380,
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