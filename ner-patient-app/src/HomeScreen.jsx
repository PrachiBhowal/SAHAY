// src/HomeScreen.jsx
import { useState, useEffect } from 'react'
import { getMemoryAssets, getPatientData, getReminders } from './lib/localStorage'
import { AccessibilityToggle } from './design-system/AccessibilityToggle'
import './HomeScreen.css'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export default function HomeScreen({
  patient: propPatient,
  onSelectGame,
  onOpenReminders,
  onOpenStillUseful,
  onOpenPortal
}) {
  const [patient, setPatient] = useState(propPatient || null)
  const [featuredPhoto, setFeaturedPhoto] = useState(null)
  const [showGuide, setShowGuide] = useState(false)
  const [stillUsefulDoneToday, setStillUsefulDoneToday] = useState(false)
  const [remindersCount, setRemindersCount] = useState(0)

  useEffect(() => {
    async function load() {
      const activePatient = propPatient || await getPatientData()
      if (!activePatient) return
      setPatient(activePatient)

      const [assets, patientReminders] = await Promise.all([
        getMemoryAssets(activePatient.id),
        getReminders(activePatient.id)
      ])

      const photos = assets.filter(a => a.type === 'photo')
      if (photos.length > 0) {
        setFeaturedPhoto(photos[Math.floor(Math.random() * photos.length)])
      }

      const doneToday = assets.some(a => a.type === 'voice' && a.tags.includes(todayKey()))
      setStillUsefulDoneToday(doneToday)
      setRemindersCount(patientReminders.length)
    }
    load()
  }, [propPatient])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = patient?.name?.split(' ')[0] || ''
  const displayGreeting = firstName ? `${greeting}, ${firstName}` : greeting

  const activities = [
    {
      id: 'memory',
      label: 'Family Face & Name',
      sub: 'Look at familiar photos of loved ones',
      category: 'Memory Improvement',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24" aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      ready: true
    },
    {
      id: 'attention',
      label: 'Spot What Changed',
      sub: 'Notice a gentle change among items',
      category: 'Attention & Focus',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
      ready: true
    },
    {
      id: 'recall',
      label: 'Daily Routine Recall',
      sub: 'Tell us about your morning and day',
      category: 'Routine Recall',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      ready: true
    },
    {
      id: 'pattern',
      label: 'Word & Pattern Chain',
      sub: 'Follow gentle clues to find the answer',
      category: 'Pattern Recognition',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
      ready: true
    }
  ]

  return (
    <div className="home-shell">
      <header className="home-header">
        <div>
          <p className="home-greeting">{displayGreeting}</p>
          <h1 className="home-headline screen-title">Your day with SAHAY</h1>
        </div>
        <button
          className="home-info-button"
          onClick={() => setShowGuide(value => !value)}
          aria-label="About today's gentle activities"
        >
          i
        </button>
      </header>

      {showGuide && (
        <div className="home-guide" role="status">
          <strong>Choose one gentle activity.</strong>
          <span>There are no wrong answers. Take your time, and touch the help button if you need support.</span>
        </div>
      )}

      {/* Featured Daily Hero Card */}
      {!stillUsefulDoneToday ? (
        <button
          type="button"
          className="home-featured-card story-hero"
          onClick={onOpenStillUseful}
        >
          <div className="home-featured-body">
            <span className="home-featured-badge">A Memory Worth Keeping</span>
            <h2 className="home-featured-title">Share today's story</h2>
            <p className="home-featured-desc">
              Record a short memory from your day. It is safely kept for your family.
            </p>
            <span className="home-action">
              Record a memory <span aria-hidden="true">&#8594;</span>
            </span>
          </div>
        </button>
      ) : (
        <button
          type="button"
          className="home-featured-card memory-hero"
          onClick={() => onSelectGame('memory')}
        >
          {featuredPhoto && (
            <img
              src={featuredPhoto.url}
              alt=""
              className="home-featured-image"
            />
          )}
          <div className="home-featured-body">
            <span className="home-featured-badge">Memory & Connection</span>
            <h2 className="home-featured-title">Look at familiar faces</h2>
            <p className="home-featured-desc">
              Connect with loved ones and recognize cherished photos.
            </p>
            <span className="home-action">
              Start activity <span aria-hidden="true">&#8594;</span>
            </span>
          </div>
        </button>
      )}

      {/* 4 Cognitive Game Categories */}
      <div className="home-section-heading">
        <h2 className="home-section-label">Cognitive Activities</h2>
        <span>Choose what feels comfortable</span>
      </div>

      <div className="home-activity-grid">
        {activities.map(act => (
          <button
            key={act.id}
            type="button"
            className="home-activity-card"
            onClick={() => onSelectGame(act.id)}
          >
            <span className="activity-card-icon" aria-hidden="true">
              {act.icon}
            </span>
            <div className="activity-card-info">
              <span className="activity-card-category">{act.category}</span>
              <strong className="activity-card-title">{act.label}</strong>
              <small className="activity-card-sub">{act.sub}</small>
            </div>
            <span className="activity-card-arrow" aria-hidden="true">
              &#8250;
            </span>
          </button>
        ))}
      </div>

      {/* Daily Routine & Care Tools */}
      <div className="home-section-heading" style={{ marginTop: 28 }}>
        <h2 className="home-section-label">Daily Care & Memories</h2>
        <span>Gentle routine support</span>
      </div>

      <div className="home-quick-tools">
        <button
          type="button"
          className="home-tool-card"
          onClick={onOpenReminders}
        >
          <div className="tool-card-left">
            <span className="tool-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </span>
            <div>
              <strong>Daily Reminders</strong>
              <small>
                {remindersCount > 0
                  ? `${remindersCount} scheduled for today`
                  : 'Check medication & hydration'}
              </small>
            </div>
          </div>
          <span className="tool-arrow">&#8250;</span>
        </button>

        <button
          type="button"
          className="home-tool-card"
          onClick={onOpenStillUseful}
        >
          <div className="tool-card-left">
            <span className="tool-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </span>
            <div>
              <strong>
                {stillUsefulDoneToday
                  ? "Today's Story (Recorded ✓)"
                  : 'Share a Daily Memory'}
              </strong>
              <small>
                {stillUsefulDoneToday
                  ? 'Listen or record another reflection'
                  : 'Express yourself for your family'}
              </small>
            </div>
          </div>
          <span className="tool-arrow">&#8250;</span>
        </button>
      </div>
    </div>
  )
}
