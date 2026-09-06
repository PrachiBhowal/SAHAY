// src/lib/difficultyBootstrap.js
//
// Runs once when the app starts. Hydrates Person 4's performanceTracker
// (rolling window) and difficultyEngine (current tiers) from whatever
// this device already has stored, so a reload doesn't silently reset
// the "3 sessions minimum" gate or the tier back to 2. Also wires local
// tier persistence via registerPersistHandler().
//
// TODO: confirm real import paths with Person 4
import { hydrate as hydrateDifficulty, registerPersistHandler } from './difficultyEngine.js'
import { hydrate as hydratePerformance } from './performanceTracker.js'
import { getPatientData, getSessionsForPatient, updatePatientDifficultyTierLocal } from './localStorage'
import { api } from './api'

const GAME_TYPES = ['memory', 'attention', 'recall', 'pattern']

export async function bootstrapDifficultyEngine(targetPatientId) {
  const patient = await getPatientData(targetPatientId)
  if (!patient) return

  const sessions = await getSessionsForPatient(patient.id)


  GAME_TYPES.forEach(gameType => {
    hydratePerformance(patient.id, gameType, sessions)
  })

  hydrateDifficulty(patient.id, patient.difficulty_tiers)

  registerPersistHandler(async (patientId, gameType, newTier) => {
    await updatePatientDifficultyTierLocal(patientId, gameType, newTier)
    const updatedPatient = await getPatientData()
    if (updatedPatient) {
      await api.updatePatient(patientId, updatedPatient.difficulty_tiers)
    }
  })
}