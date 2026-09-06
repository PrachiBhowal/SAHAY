import { useEffect, useState } from 'react'
import { getPatientData, getReminders, cacheReminders } from './lib/localStorage'
import { api } from './lib/api'
import FamilyVoiceReminder from './person3/familyVoice/FamilyVoiceReminder'
import './RemindersScreen.css'

export default function RemindersScreen({ onBack, patient: propPatient }) {
  const [patient, setPatient] = useState(propPatient || null)
  const [reminders, setReminders] = useState([])
  const [selectedReminder, setSelectedReminder] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const p = propPatient || await getPatientData()
      if (p) {
        setPatient(p)
        setReminders(await getReminders(p.id))
        try {
          const remoteReminders = await api.getReminders(p.id)
          if (!cancelled) {
            setReminders(remoteReminders)
            await cacheReminders(remoteReminders)
          }
        } catch (error) {
          console.warn('[patient-app] reminder refresh unavailable:', error)
        }
      }
    }
    load()

    const refreshOnReturn = () => load()
    window.addEventListener('focus', refreshOnReturn)
    const interval = window.setInterval(load, 30000)
    return () => {
      cancelled = true
      window.removeEventListener('focus', refreshOnReturn)
      window.clearInterval(interval)
    }
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