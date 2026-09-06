// src/StillUseful.jsx
import { useState, useEffect, useRef } from 'react'
import { getPatientData, saveMemoryAsset, getMemoryAssets } from './lib/localStorage'
import { api } from './lib/api'
import './StillUseful.css'

const PROMPTS = [
  'Tell us a memory from when you were young.',
  'What is a place you loved to visit?',
  'Tell us about someone who made you laugh.',
  'What did your village look like when you were a child?'
]

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default function StillUseful({ onBack }) {
  const [patient, setPatient] = useState(null)
  const [alreadyRecordedToday, setAlreadyRecordedToday] = useState(false)
  const [savedStories, setSavedStories] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [micError, setMicError] = useState(null)
  const [prompt] = useState(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const mimeTypeRef = useRef('audio/webm')

  useEffect(() => {
    async function load() {
      const p = await getPatientData()
      setPatient(p)
      const assets = await getMemoryAssets(p.id)
      setSavedStories(assets.filter(a => a.type === 'voice').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
      const today = todayKey()
      const recordedToday = assets.some(
        a => a.type === 'voice' && a.tags.includes(today)
      )
      setAlreadyRecordedToday(recordedToday)
    }
    load()
  }, [])

  async function startRecording() {
    setMicError(null)
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      // real failure path — no mic access, no permission, etc.
      // Shown honestly, not swallowed silently. Most browsers won't
      // re-prompt after an explicit deny, so we tell the patient/caregiver
      // where to actually fix it instead of just "try again."
      setMicError(
        'We couldn\u2019t reach the microphone. Please check your browser\u2019s site settings and allow microphone access, then try again.'
      )
      return
    }

    // Pick the first mimeType the browser actually supports, instead of
    // assuming webm — Safari-family browsers commonly don't support it and
    // will silently record in a different container while we'd have
    // labeled the resulting Blob as webm, breaking playback later.
    const preferredTypes = [
      'audio/webm',
      'audio/mp4',
      'audio/ogg',
      'audio/wav'
    ]
    const supportedType = preferredTypes.find(
      t => typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(t)
    )

    let recorder
    try {
      recorder = supportedType
        ? new MediaRecorder(stream, { mimeType: supportedType })
        : new MediaRecorder(stream) // let the browser choose if none of our guesses are supported
    } catch (err) {
      setMicError('Recording isn\u2019t supported on this device\u2019s browser.')
      stream.getTracks().forEach(track => track.stop())
      return
    }

    // Use whatever the recorder actually reports, not our guess —
    // this is the single source of truth for how the Blob should be typed.
    mimeTypeRef.current = recorder.mimeType || supportedType || 'audio/webm'
    chunksRef.current = []

    recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current })
      const url = await blobToDataUrl(blob)
      const asset = {
        id: crypto.randomUUID(),
        patient_id: patient.id,
        type: 'voice',
        url,
        tags: [todayKey()],
        uploaded_by: patient.id,
        created_at: new Date().toISOString()
      }

      await saveMemoryAsset(asset)
      try {
        await api.sync(patient.id, [], [], [asset])
      } catch (error) {
        console.warn('[patient-app] story queued for later sync:', error)
      }

      setSavedStories(current => [asset, ...current])

      setAlreadyRecordedToday(true)
      stream.getTracks().forEach(track => track.stop())

      // return home automatically once recording is saved, so the flow
      // feels complete rather than leaving the patient stranded on a
      // "thank you" screen with no next action
      setTimeout(() => onBack(), 2000)
    }

    recorder.start()
    mediaRecorderRef.current = recorder
    setIsRecording(true)
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }

  if (!patient) return <div className="still-useful-loading">Loading...</div>

  return (
    <div className="still-useful-shell">
      <button className="still-useful-back" onClick={onBack}>&#8592; Back</button>

      <div className="still-useful-content">
        {alreadyRecordedToday ? (
          <>
            <p className="still-useful-headline">Thank you for sharing today.</p>
            <p className="still-useful-subtext">Come back tomorrow for another memory.</p>
          </>
        ) : (
          <>
            <p className="still-useful-label">Today's memory</p>
            <p className="still-useful-headline">{prompt}</p>
            <button
              className={`still-useful-record-btn ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? 'Stop' : 'Start recording'}
            </button>
            {micError && <p className="still-useful-error">{micError}</p>}
          </>
        )}
      </div>

      {savedStories.length > 0 && (
        <section className="still-useful-stories" aria-labelledby="saved-stories-title">
          <h2 id="saved-stories-title">Saved stories</h2>
          {savedStories.map(story => (
            <article className="still-useful-story" key={story.id}>
              <span>{story.tags?.[0] || 'Saved memory'}</span>
              <small>{new Date(story.created_at).toLocaleString()}</small>
              <audio controls preload="metadata" src={story.url} aria-label="Play saved story" />
            </article>
          ))}
        </section>
      )}
    </div>
  )
}