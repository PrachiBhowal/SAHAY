import { useEffect, useState, useRef } from 'react'
import { getPatientData, saveSession } from '../lib/localStorage'
import { getCurrentTier, hydrate, updateTierAfterSession } from '../lib/difficultyEngine'
import Countdown from '../shared/Countdown.jsx'
import './AttentionGame.css'

// Expanded from 5 to 10 items. At the hardest tier the round shows up to
// 5 items — with only 5 items in the bank, that left ZERO items outside
// the shown set to draw distractors from, which is exactly why higher
// levels collapsed to a single (correct-only) choice. With 10 items,
// at least 5 always remain outside any round regardless of tier.
const ITEMS = [
  'A woven basket', 'A blue cup', 'A green leaf', 'A brass bell', 'A red shawl',
  'A clay pot', 'A wooden comb', 'A palm fan', 'A brass lamp', 'A cotton scarf'
]
const MIN_CHOICE_COUNT = 3

function shuffled(items) {
  return [...items].sort(() => Math.random() - 0.5)
}

export default function AttentionGame({ onBack }) {
  const [patient, setPatient] = useState(null)
  const [items, setItems] = useState([])
  const [missingItem, setMissingItem] = useState('')
  const [choices, setChoices] = useState([])
  const [phase, setPhase] = useState('countdown')
  const [message, setMessage] = useState('Remember these items.')
  const [startedAt, setStartedAt] = useState(null)
  const [tier, setTier] = useState(2)
  const [countdown, setCountdown] = useState(10)
  const tierRef = useRef(2) // always holds the current tier, no stale closures

  useEffect(() => {
    async function load() {
      const currentPatient = await getPatientData()
      if (!currentPatient) return
      hydrate(currentPatient.id, currentPatient.difficulty_tiers)
      const realTier = getCurrentTier(currentPatient.id, 'attention')
      tierRef.current = realTier
      setTier(realTier)
      setPatient(currentPatient)
    }
    load()
  }, [])

  function beginRound() {
    const currentTier = tierRef.current
    // Cap shown items so at least 2 always remain outside the round for
    // distractors, no matter how large ITEMS grows or shrinks later —
    // this guard is the actual fix, the bigger bank just makes it easy
    // to satisfy at every tier we currently define.
    const maxShowable = Math.max(1, ITEMS.length - (MIN_CHOICE_COUNT - 1))
    const desiredShown = 3 + Math.min(currentTier - 1, 2)
    const shownCount = Math.min(desiredShown, maxShowable)

    const pool = shuffled(ITEMS)
    const first = pool.slice(0, shownCount)
    setItems(first)

    const missing = first[Math.floor(Math.random() * first.length)]
    setMissingItem(missing)

    const outsidePool = ITEMS.filter(item => !first.includes(item))
    const distractors = shuffled(outsidePool).slice(0, MIN_CHOICE_COUNT - 1)
    setChoices(shuffled([missing, ...distractors]))

    setPhase('view')
    setStartedAt(Date.now())
    setCountdown(10)
    setMessage('Remember these items.')
  }

  useEffect(() => {
    if (phase !== 'view' || items.length === 0) return undefined
    const interval = window.setInterval(() => {
      setCountdown(value => Math.max(0, value - 1))
    }, 1000)
    const timeout = window.setTimeout(() => {
      setItems(items.filter(item => item !== missingItem))
      setPhase('choose')
      setMessage('One item is missing. Which one was it?')
    }, 10000)
    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timeout)
    }
  }, [phase, items, missingItem])

  async function answer(item) {
    if (phase !== 'choose') return
    const correct = item === missingItem
    const session = {
      id: crypto.randomUUID(),
      patient_id: patient.id,
      game_type: 'attention',
      timestamp: new Date().toISOString(),
      accuracy: correct ? 1 : 0.5,
      response_time_ms: Date.now() - startedAt,
      hints_used: correct ? 0 : 1,
      difficulty_tier: tierRef.current
    }
    await saveSession(session)
    const nextTier = updateTierAfterSession(patient.id, 'attention', session)
    tierRef.current = nextTier // update ref immediately, no waiting on re-render
    setTier(nextTier)
    setMessage(correct ? `Yes, the ${missingItem.toLowerCase()} was missing.` : 'That was a thoughtful look. Let us try another one.')
    setPhase('result')
    setTimeout(beginRound, 1800)
  }

  if (!patient) return <div className="attention-shell">Loading...</div>

  return (
    <div className="attention-shell">
      {phase === 'countdown' ? (
        <Countdown
          seconds={5}
          onComplete={beginRound}
          onCancel={onBack}
        />
      ) : (
        <button className="attention-back" onClick={onBack}>&#8592; Back</button>
      )}

      <main className="attention-content">
        <p className="attention-kicker">Attention and concentration</p>
        <h1 className="screen-title">Spot what changed</h1>
        <p className="attention-tier">Level {tier}</p>
        <p className="attention-message" aria-live="polite">{message}</p>
        {phase === 'view' && <p className="attention-countdown" aria-live="polite">Next step in {countdown}</p>}
        <div className={`attention-items attention-items-${phase}`}>
          {items.map(item => (
            <div key={item} className="attention-item" aria-label={item}>{item}</div>
          ))}
        </div>
        {phase === 'choose' && (
          <div className="attention-choices">
            <p>Which item disappeared?</p>
            {choices.map(item => <button key={item} className="attention-choice" onClick={() => answer(item)}>{item}</button>)}
          </div>
        )}
      </main>
    </div>
  )
}
