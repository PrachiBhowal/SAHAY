// src/lib/devSeed.js
import { savePatientData, saveMemoryAsset } from './localStorage'

export async function seedDevData() {
  const patientId = 'dev-patient-1'

  await savePatientData({
    id: patientId,
    name: 'Test Patient',
    language_pref: 'as',
    region_village: 'Test Village',
    difficulty_tiers: { memory: 2, attention: 2, recall: 2, pattern: 2 },
    created_at: new Date().toISOString()
  })

  const fakePhotos = [
    { name: 'Rina', url: 'https://placehold.co/300x300?text=Rina' },
    { name: 'Deepak', url: 'https://placehold.co/300x300?text=Deepak' },
    { name: 'Anjali', url: 'https://placehold.co/300x300?text=Anjali' },
    { name: 'Bimal', url: 'https://placehold.co/300x300?text=Bimal' },
    { name: 'Mina', url: 'https://placehold.co/300x300?text=Mina' }
  ]

  for (const p of fakePhotos) {
    await saveMemoryAsset({
      id: crypto.randomUUID(),
      patient_id: patientId,
      type: 'photo',
      url: p.url,
      tags: [p.name],
      uploaded_by: 'dev-caregiver',
      created_at: new Date().toISOString()
    })
  }
}