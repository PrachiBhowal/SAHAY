// src/games/Game1FamilyRecognition.jsx
import { useState, useEffect } from 'react'
import { saveSession, getPatientData, getMemoryAssets } from '../lib/localStorage'
import './Game1.css'

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

  function pickRound(pool) {
    if (pool.length < 4) return
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    const target = shuffled[0]
    const distractors = shuffled.slice(1, 4)
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
      setHintsUsed(h => h + 1)
      const nudges = [
        'Take another look.',
        'No rush at all.',
        'Have another look at the photo.'
      ]
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

  const mode = patient ? modeForTier(patient.difficulty_tiers.memory) : null

  if (!patient || !currentPhoto) return <div className="game1-loading">Loading...</div>

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
          <button className="game1-mic-btn">Say the name</button>
        </div>
      )}
    </div>
  )
}