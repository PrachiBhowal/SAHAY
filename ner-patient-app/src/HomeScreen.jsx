// src/HomeScreen.jsx
import { useState, useEffect } from 'react'
import { getMemoryAssets, getPatientData } from './lib/localStorage'
import './HomeScreen.css'

const OTHER_ACTIVITIES = [
  { id: 'attention', label: 'Spot what changed', ready: false },
  { id: 'recall', label: 'Tell us about your day', ready: true },
  { id: 'pattern', label: 'Word chain', ready: false }
]

export default function HomeScreen({
  onSelectGame,
  onOpenReminders,
  onOpenFamilyVoice
}) {
  const [featuredPhoto, setFeaturedPhoto] = useState(null)

  useEffect(() => {
    async function load() {
      const patient = await getPatientData()
      if (!patient) return
      const assets = await getMemoryAssets(patient.id)
      const photos = assets.filter(a => a.type === 'photo')
      if (photos.length > 0) {
        setFeaturedPhoto(
          photos[Math.floor(Math.random() * photos.length)]
        )
      }
    }

    load()
  }, [])

  const hour = new Date().getHours()
  const greeting =
    hour < 12
      ? 'Good morning'
      : hour < 17
        ? 'Good afternoon'
        : 'Good evening'

  return (
    <div className="home-shell">
      <p className="home-greeting">{greeting}</p>
      <h1 className="home-headline">
        Let's look at some photos
      </h1>

      <button
        className="home-featured-card"
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
          <p className="home-featured-label">
            Today's activity
          </p>
          <p className="home-featured-title">Who is this?</p>
          <div className="home-begin-btn">Begin</div>
        </div>
      </button>

      <p className="home-section-label">Also today</p>

      <div className="home-row-list">
        {OTHER_ACTIVITIES.map((activity) => (
          <button
            key={activity.id}
            className="home-row"
            onClick={() =>
              activity.ready && onSelectGame(activity.id)
            }
            disabled={!activity.ready}
          >
            <span>{activity.label}</span>
            <span aria-hidden="true">&#8250;</span>
          </button>
        ))}

        <button
          className="home-row"
          onClick={onOpenReminders}
        >
          <span>Reminders</span>
          <span aria-hidden="true">&#8250;</span>
        </button>

        <button
          className="home-row"
          onClick={onOpenFamilyVoice}
        >
          <span>Record a family voice reminder</span>
          <span aria-hidden="true">&#8250;</span>
        </button>
      </div>
    </div>
  )
}