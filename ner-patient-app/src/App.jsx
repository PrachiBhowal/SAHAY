// src/App.jsx
import { useEffect, useState } from 'react'
import HomeScreen from './HomeScreen'
import Game1FamilyRecognition from './games/Game1FamilyRecognition'
import AttentionGame from './games/AttentionGame'
import Game3Screen from './person3/game3/Game3Screen'
import Game4PatternWordChain from './shared/Game4_PatternWordChain.jsx'
import StillUseful from './StillUseful'
import RemindersScreen from './RemindersScreen'
import PatientLoginScreen from './PatientLoginScreen'
import AndroidAppBar from './components/AndroidAppBar'
import AndroidBottomNav from './components/AndroidBottomNav'
import CaregiverPortalModal from './components/CaregiverPortalModal'
import { getPatientData, clearActivePatient, setActivePatientId, getPendingSyncItems, clearSyncQueueItem } from './lib/localStorage'
import { getAuthToken, getTokenPatientId, clearAuthToken, api } from './lib/api'
import { ComfortTriggerContainer } from './shared/ComfortTrigger.jsx'
import './tokens.css'
import './App.css'

function App() {
  const [screen, setScreen] = useState('home')
  const [patient, setPatient] = useState(null)
  const [patientId, setPatientId] = useState(undefined)
  const [showHelp, setShowHelp] = useState(false)
  const [portalOpen, setPortalOpen] = useState(false)
  const [syncStatus, setSyncStatus] = useState(() => window.localStorage.getItem('sahay_sync_status') || 'online')
  const [bootstrapping, setBootstrapping] = useState(true)
  const [dueReminder, setDueReminder] = useState(null)

  const activityHelp = {
    home: 'Choose any activity that looks welcoming. Take your time.',
    memory: 'Look at the familiar photo, then choose or say who it reminds you of.',
    attention: 'First remember the items you see. Then choose the item that disappeared.',
    recall: 'Take your time and tell us about something you usually do during your day.',
    pattern: 'Follow the clues and choose the object or word that completes the pattern.',
    reminders: 'Tap a reminder to hear its message or listen to a voice note from your family.',
    'still-useful': 'Record a memory from your day. It is saved for your family to keep.'
  }

  // Check URL param or local active patient on load
  useEffect(() => {
    const handleReminderDue = event => setDueReminder(event.detail)
    window.addEventListener('sahay-reminder-due', handleReminderDue)
    return () => window.removeEventListener('sahay-reminder-due', handleReminderDue)
  }, [])

  useEffect(() => {
    async function loadActivePatient() {
      const urlParams = new URLSearchParams(window.location.search)
      const paramPatientId = urlParams.get('patientId') || getTokenPatientId()

      if (!getAuthToken()) {
        setBootstrapping(false)
        return
      }

      if (paramPatientId) setActivePatientId(paramPatientId)
      const p = await getPatientData(paramPatientId || undefined)
      if (p) {
        setPatient(p)
        setPatientId(p.id)
      }
      setBootstrapping(false)
    }

    loadActivePatient()
  }, [])

  useEffect(() => {
    const handleSyncStatus = event => setSyncStatus(event.detail)
    window.addEventListener('sahay-sync-status', handleSyncStatus)
    return () => window.removeEventListener('sahay-sync-status', handleSyncStatus)
  }, [])

  useEffect(() => {
    if (!patientId) return undefined
    let cancelled = false
    const alertedKey = `sahay_alerted_reminders_${patientId}`
    const checkReminders = async () => {
      try {
        const reminders = await api.getReminders(patientId)
        const now = new Date()
        const today = [now.getFullYear(), now.getMonth() + 1, now.getDate()].join('-')
        const alerted = JSON.parse(window.localStorage.getItem(alertedKey) || '{}')
        for (const reminder of reminders) {
          const [hours, minutes] = String(reminder.time).split(':').map(Number)
          const due = new Date(now)
          due.setHours(hours, minutes, 0, 0)
          const alertId = `${today}:${reminder.id}`
          if (!cancelled && due <= now && due >= new Date(now.getTime() - 60 * 60 * 1000) && !alerted[alertId]) {
            alerted[alertId] = true
            setDueReminder(reminder)
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('SAHAY reminder', { body: reminder.message })
            }
            window.dispatchEvent(new CustomEvent('sahay-reminder-due', { detail: reminder }))
          }
        }
        window.localStorage.setItem(alertedKey, JSON.stringify(alerted))
      } catch (error) {
        console.warn('[patient-app] reminder check unavailable:', error)
      }
    }
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission()
    checkReminders()
    const interval = window.setInterval(checkReminders, 30000)
    return () => { cancelled = true; window.clearInterval(interval) }
  }, [patientId])

  // BUG FIX: document.documentElement.lang was previously only ever set
  // inside Game 3 (DailyRoutineRecall.jsx), so ASR in every other screen
  // (e.g. Game 1's voice-recall mode) silently defaulted to English for
  // any patient whose actual language_pref was something else. Setting
  // it here, keyed to the active patient, makes the whole app consistent
  // regardless of which screen the patient opens first.
  useEffect(() => {
    if (patient?.language_pref) {
      document.documentElement.lang = patient.language_pref
    }
  }, [patient?.language_pref])

  async function handleTriggerSync() {
    if (!patientId) return { syncedCount: 0 }
    const pending = await getPendingSyncItems()
    const queuedSessions = pending
      .filter(p => p.type === 'session' || (!p.type && p.item && 'game_type' in p.item))
      .map(p => p.item)
    const queuedAlerts = pending
      .filter(p => p.type === 'alert' || (!p.type && p.item && 'trigger_type' in p.item))
      .map(p => p.item)
    const queuedMemoryAssets = pending
      .filter(p => p.type === 'memory_asset')
      .map(p => p.item)

    if (queuedSessions.length === 0 && queuedAlerts.length === 0 && queuedMemoryAssets.length === 0) return { syncedCount: 0 }

    const result = await api.sync(patientId, queuedSessions, queuedAlerts, queuedMemoryAssets)
    const failedIds = new Set((result.failed || []).map(item => item.id))
    await Promise.all(
      pending
        .filter(item => item.type === 'session' || item.type === 'alert')
        .filter(item => !failedIds.has(item.item.id))
        .map(item => clearSyncQueueItem(item.id))
    )
    return { syncedCount: result.synced_count || 0 }
  }

  function handleSelectPatient(selected) {
    setPatient(selected)
    setPatientId(selected.id)
    setScreen('home')
  }

  function handleSwitchPatient() {
    clearAuthToken()
    clearActivePatient()
    setPatient(null)
    setPatientId(undefined)
    setPortalOpen(false)
    setScreen('login')
  }

  function handleNavigateTab(tab) {
    if (tab === 'portal') {
      setPortalOpen(true)
    } else {
      setScreen(tab)
    }
  }

  if (bootstrapping) {
    return (
      <div className="app-bootstrap-loading">
        <div className="patient-login-spinner" />
        <p>Starting SAHAY...</p>
      </div>
    )
  }

  // If no patient profile is chosen, show Patient Login & Selection Screen
  if (!patient || screen === 'login') {
    return <PatientLoginScreen onSelectPatient={handleSelectPatient} />
  }

  const isMainTab = screen === 'home' || screen === 'reminders' || screen === 'still-useful'

  const appContent = (
    <div className="android-app-container">
      <AndroidAppBar
        patient={patient}
        syncStatus={syncStatus}
        screen={screen}
        onBack={() => setScreen('home')}
        onSwitchPatient={handleSwitchPatient}
        onOpenHelp={() => setShowHelp(v => !v)}
      />

      {syncStatus === 'offline' && (
        <div className="sync-status-banner" role="status" aria-live="polite">
          Offline mode: your activities are saved on this device and will sync when connected.
        </div>
      )}

      {dueReminder && (
        <div className="patient-reminder-alert" role="alert">
          <strong>Reminder</strong>
          <span>{dueReminder.message}</span>
          <button type="button" onClick={() => setDueReminder(null)}>Dismiss</button>
        </div>
      )}

      {showHelp && (
        <div className="global-help-panel" role="status">
          <strong>How this works</strong>
          <span>{activityHelp[screen] || activityHelp.home}</span>
          <button type="button" className="help-dismiss-btn" onClick={() => setShowHelp(false)}>Got it</button>
        </div>
      )}

      <main className={`android-app-main ${isMainTab ? 'has-bottom-nav' : ''}`}>
        {screen === 'home' && (
          <HomeScreen
            patient={patient}
            onSelectGame={(gameId) => setScreen(gameId)}
            onOpenReminders={() => setScreen('reminders')}
            onOpenStillUseful={() => setScreen('still-useful')}
            onOpenPortal={() => setPortalOpen(true)}
          />
        )}

        {screen === 'memory' && (
          <Game1FamilyRecognition onBack={() => setScreen('home')} />
        )}
        {screen === 'attention' && (
          <AttentionGame onBack={() => setScreen('home')} />
        )}
        {screen === 'pattern' && patientId && (
          <Game4PatternWordChain patientId={patientId} onBack={() => setScreen('home')} />
        )}
        {screen === 'still-useful' && (
          <StillUseful onBack={() => setScreen('home')} />
        )}
        {screen === 'recall' && (
          <Game3Screen onBack={() => setScreen('home')} />
        )}
        {screen === 'reminders' && (
          <RemindersScreen onBack={() => setScreen('home')} patient={patient} />
        )}
      </main>

      {isMainTab && (
        <AndroidBottomNav
          activeTab={screen}
          onNavigate={handleNavigateTab}
          onSwitchPatient={handleSwitchPatient}
        />
      )}

      {portalOpen && (
        <CaregiverPortalModal
          patient={patient}
          onClose={() => setPortalOpen(false)}
          onSwitchPatient={handleSwitchPatient}
          onTriggerSync={handleTriggerSync}
          onPatientUpdated={setPatient}
          syncStatus={syncStatus}
        />
      )}
    </div>
  )

  return (
    <div className="sahay-root-wrapper">
      {patientId ? (
        <ComfortTriggerContainer
          patientId={patientId}
          apiBaseUrl={import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}
          authToken={getAuthToken()}
        >
          {appContent}
        </ComfortTriggerContainer>
      ) : (
        appContent
      )}
    </div>
  )
}

export default App