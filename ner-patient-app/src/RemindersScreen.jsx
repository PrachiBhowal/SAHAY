import { useEffect, useState } from 'react'
import { getPatientData, getReminders } from './lib/localStorage'
import FamilyVoiceReminder from './person3/familyVoice/FamilyVoiceReminder'
import './RemindersScreen.css'

export default function RemindersScreen({ onBack, patient: propPatient }) {
  const [patient, setPatient] = useState(propPatient || null)
  const [reminders, setReminders] = useState([])
  const [selectedReminder, setSelectedReminder] = useState(null)

  useEffect(() => {
    async function load() {
      const p = propPatient || await getPatientData()
      if (p) {
        setPatient(p)
        setReminders(await getReminders(p.id))
      }
    }
    load()
  }, [propPatient])

  return (
    <div className="reminders-shell">
      <button className="reminders-back" onClick={onBack}>&#8592; Back</button>
      <main className="reminders-content">
        <p className="reminders-kicker">Today</p>
        <h1 className="screen-title">Your reminders</h1>
        <p className="reminders-intro">A gentle list of things to help your day go well.</p>
        <div className="reminders-list">
          {reminders.map(reminder => (
            <button key={reminder.id} className="reminder-card" onClick={() => setSelectedReminder(reminder)}>
              <span className="reminder-time">{reminder.time}</span>
              <span>
                <strong>{reminder.message}</strong>
                <small>{reminder.type} · {reminder.recurrence}</small>
              </span>
            </button>
          ))}
          {reminders.length === 0 && <p className="reminders-empty">There are no reminders yet.</p>}
        </div>
        {selectedReminder && (
          <div className="reminder-detail">
            <FamilyVoiceReminder
              reminder={selectedReminder}
              languageCode={patient?.language_pref || 'as'}
            />
            <button className="reminder-close" onClick={() => setSelectedReminder(null)}>Done</button>
          </div>
        )}

      </main>
    </div>
  )
}