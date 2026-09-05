// src/lib/difficultyBootstrap.js
//
// Runs once when the app starts. Hydrates Person 4's performanceTracker
// (rolling window) and difficultyEngine (current tiers) from whatever
// this device already has stored, so a reload doesn't silently reset
// the "3 sessions minimum" gate or the tier back to 2. Also wires local
// tier persistence via registerPersistHandler().
//
// TODO: confirm real import paths with Person 4
import { hydrate as hydrateDifficulty, registerPersistHandler } from '../lib/difficultyEngine'
import { hydrate as hydratePerformance } from '../lib/performanceTracker'
import { getPatientData, getSessionsForPatient, updatePatientDifficultyTierLocal } from './localStorage'

const GAME_TYPES = ['memory', 'attention', 'recall', 'pattern']

export async function bootstrapDifficultyEngine() {
  const patient = await getPatientData()
  if (!patient) return

  const sessions = await getSessionsForPatient(patient.id)

  GAME_TYPES.forEach(gameType => {
    hydratePerformance(patient.id, gameType, sessions)
  })

  hydrateDifficulty(patient.id, patient.difficulty_tiers)

  registerPersistHandler((patientId, gameType, newTier) => {
    updatePatientDifficultyTierLocal(patientId, gameType, newTier)
  })
}