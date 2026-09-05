// src/StillUseful.jsx
import { useState, useEffect, useRef } from 'react'
import { getPatientData, saveMemoryAsset, getMemoryAssets } from './lib/localStorage'
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

export default function StillUseful({ onBack }) {
  const [patient, setPatient] = useState(null)
  const [alreadyRecordedToday, setAlreadyRecordedToday] = useState(false)
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

      // KNOWN GAP, not silently solved: this URL only survives the current
      // browser session/device. Person 5 needs a real upload endpoint before
      // this can sync across devices or survive a reload after clearing
      // browser storage. Flag in CONTRACTS.md Section 4 before relying on
      // this for the demo beyond a single device.
      const url = URL.createObjectURL(blob)

      await saveMemoryAsset({
        id: crypto.randomUUID(),
        patient_id: patient.id,
        type: 'voice',
        url,
        tags: [todayKey()],
        // KNOWN MISMATCH, not silently resolved: CONTRACTS.md types
        // uploaded_by as Caregiver.id, but this is patient-recorded.
        // Using patient.id here until the team confirms the intended
        // field/type for patient-originated MemoryAssets.
        uploaded_by: patient.id,
        created_at: new Date().toISOString()
      })

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
    </div>
  )
}