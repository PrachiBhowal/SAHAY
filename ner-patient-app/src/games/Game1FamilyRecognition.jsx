// src/games/Game1FamilyRecognition.jsx
import { useState, useEffect } from 'react'
import { saveSession, getPatientData, getMemoryAssets } from '../lib/localStorage'
import { useASR } from '../hooks/useASR'
import './Game1.css'

const MAX_GENTLE_MISSES = 6

function modeForTier(tier) {
  return tier <= 2 ? 'voice_recall' : 'multiple_choice'
}

export default function Game1FamilyRecognition({ onBack }) {
  const [patient, setPatient] = useState(null)
  const [photos, setPhotos] = useState([])
  const [currentPhoto, setCurrentPhoto] = useState(null)
  const [options, setOptions] = useState([])
  const [sessionStart, setSessionStart] = useState(null)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [redirectMessage, setRedirectMessage] = useState('Take your time.')
  const { transcript, isListening, isReady, startListening } = useASR()

  useEffect(() => {
    async function load() {
      const p = await getPatientData()
      setPatient(p)
      const assets = await getMemoryAssets(p.id)
      const familyPhotos = assets.filter(a => a.type === 'photo')
      setPhotos(familyPhotos)
      pickRound(familyPhotos)
    }
    load()
  }, [])

  useEffect(() => {
    if (!transcript || !currentPhoto) return
    handleAnswer(transcript.toLowerCase().trim(), currentPhoto.tags[0].toLowerCase().trim())
  }, [transcript, currentPhoto?.id])

  function pickRound(pool) {
    // No photos at all — tell the truth instead of spinning forever.
    if (pool.length === 0) {
      setCurrentPhoto(null)
      setOptions([])
      setRedirectMessage('No family photos yet — ask a caregiver to add some.')
      return
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    const target = shuffled[0]

    // Works whether we have 4+ photos or fewer — never silently stalls.
    const distractors = shuffled
      .filter(p => p.id !== target.id)
      .slice(0, Math.min(3, shuffled.length - 1))

    setCurrentPhoto(target)
    setOptions([target, ...distractors].sort(() => Math.random() - 0.5))
    setSessionStart(Date.now())
    setHintsUsed(0)
    setRedirectMessage('Take your time.')
  }

  async function handleAnswer(selectedName, correctName) {
    const isCorrect = selectedName === correctName
    const responseTimeMs = Date.now() - sessionStart

    if (!isCorrect) {
      const nextMisses = hintsUsed + 1
      setHintsUsed(nextMisses)

      // Never let the patient get stuck in an unbounded loop of gentle
      // failure — after enough misses, quietly rotate to a new photo
      // instead of endlessly re-prompting the same one. Mirrors Game 2's
      // 6-miss rotation so the validation-therapy principle holds in
      // spirit, not just in literal "no wrong answer shown."
      if (nextMisses >= MAX_GENTLE_MISSES) {
        setRedirectMessage("Let's try someone else.")
        setTimeout(() => pickRound(photos), 1500)
        return
      }

      const nudges = ['Take another look.', 'No rush at all.', 'Have another look at the photo.']
      setRedirectMessage(nudges[hintsUsed % nudges.length])
      return
    }

    setRedirectMessage("That's them.")

    const session = {
      id: crypto.randomUUID(),
      patient_id: patient.id,
      game_type: 'memory',
      timestamp: new Date().toISOString(),
      accuracy: hintsUsed === 0 ? 1.0 : 1.0 / (hintsUsed + 1),
      response_time_ms: responseTimeMs,
      hints_used: hintsUsed,
      difficulty_tier: patient.difficulty_tiers.memory
    }

    await saveSession(session)
    setTimeout(() => pickRound(photos), 1500)
  }

  // Voice-recall mode requires real ASR. If it's not ready yet, fall back
  // to multiple-choice rather than showing a mic button that does nothing —
  // a dead control is worse than a mode switch the patient never notices.
  const requestedMode = patient ? modeForTier(patient.difficulty_tiers.memory) : null
  const mode = requestedMode === 'voice_recall' && !isReady ? 'multiple_choice' : requestedMode

  if (!patient) return <div className="game1-loading">Loading...</div>

  // No photos available yet — show the real state instead of an infinite spinner.
  if (!currentPhoto) {
    return (
      <div className="game1-shell">
        <button className="game1-back" onClick={onBack}>&#8592; Back</button>
        <div className="game1-content">
          <p className="game1-message" aria-live="polite">{redirectMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="game1-shell">
      <button className="game1-back" onClick={onBack}>&#8592; Back</button>

      <div className="game1-content">
        <img src={currentPhoto.url} alt="" className="game1-photo" />
        <p className="game1-message" aria-live="polite">{redirectMessage}</p>
        <p className="game1-prompt">Who does this remind you of?</p>
      </div>

      {mode === 'multiple_choice' && (
        <div className="game1-options">
          {options.map(opt => (
            <button
              key={opt.id}
              className="game1-option-btn"
              onClick={() => handleAnswer(opt.tags[0], currentPhoto.tags[0])}
            >
              {opt.tags[0]}
            </button>
          ))}
        </div>
      )}

      {mode === 'voice_recall' && (
        <div className="game1-voice-recall">
          <button className="game1-mic-btn" onClick={startListening} disabled={isListening}>
            {isListening ? 'Listening...' : 'Say the name'}
          </button>
        </div>
      )}
    </div>
  )
}