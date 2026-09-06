// src/lib/devSeed.js
import { savePatientData, saveMemoryAsset, cacheReminders } from './localStorage'

const DEMO_PATIENTS = [
  {
    id: 'p1',
    name: 'Rina Devi',
    language_pref: 'as',
    region_village: 'Nagaon, Assam',
    difficulty_tiers: { memory: 3, attention: 2, recall: 3, pattern: 2 },
    created_at: new Date().toISOString()
  },
  {
    id: 'p2',
    name: 'Bipul Saikia',
    language_pref: 'as',
    region_village: 'Jorhat, Assam',
    difficulty_tiers: { memory: 2, attention: 2, recall: 2, pattern: 2 },
    created_at: new Date().toISOString()
  },
  {
    id: 'p3',
    name: 'Anima Baruah',
    language_pref: 'as',
    region_village: 'Sivasagar, Assam',
    difficulty_tiers: { memory: 2, attention: 1, recall: 2, pattern: 1 },
    created_at: new Date().toISOString()
  }
]

export async function seedDevData() {
  for (const patient of DEMO_PATIENTS) {
    await savePatientData(patient)

    const fakePhotos = [
      { name: 'Rina', url: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22 viewBox=%220 0 300 300%22%3E%3Crect width=%22300%22 height=%22300%22 fill=%22%23C77B4F%22/%3E%3Ctext x=%22150%22 y=%22160%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2232%22 font-family=%22sans-serif%22%3ERina%3C/text%3E%3C/svg%3E' },
      { name: 'Deepak', url: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22 viewBox=%220 0 300 300%22%3E%3Crect width=%22300%22 height=%22300%22 fill=%22%238A9A7B%22/%3E%3Ctext x=%22150%22 y=%22160%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2232%22 font-family=%22sans-serif%22%3EDeepak%3C/text%3E%3C/svg%3E' },
      { name: 'Anjali', url: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22 viewBox=%220 0 300 300%22%3E%3Crect width=%22300%22 height=%22300%22 fill=%22%23D9A441%22/%3E%3Ctext x=%22150%22 y=%22160%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2232%22 font-family=%22sans-serif%22%3EAnjali%3C/text%3E%3C/svg%3E' },
      { name: 'Bimal', url: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22 viewBox=%220 0 300 300%22%3E%3Crect width=%22300%22 height=%22300%22 fill=%22%236B4F3B%22/%3E%3Ctext x=%22150%22 y=%22160%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2232%22 font-family=%22sans-serif%22%3EBimal%3C/text%3E%3C/svg%3E' },
      { name: 'Mina', url: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22 viewBox=%220 0 300 300%22%3E%3Crect width=%22300%22 height=%22300%22 fill=%22%233A2E24%22/%3E%3Ctext x=%22150%22 y=%22160%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2232%22 font-family=%22sans-serif%22%3EMina%3C/text%3E%3C/svg%3E' }
    ]

    for (const p of fakePhotos) {
      await saveMemoryAsset({
        id: crypto.randomUUID(),
        patient_id: patient.id,
        type: 'photo',
        url: p.url,
        tags: [p.name],
        uploaded_by: 'dev-caregiver',
        created_at: new Date().toISOString()
      })
    }

    // BUG FIX: no reminders were ever seeded, so RemindersScreen always
    // rendered an empty list — meaning FamilyVoiceReminder (nested inside
    // a reminder's expanded detail view) had nothing to attach to and
    // was effectively invisible in any offline/dev-seeded run. One of
    // each of the four required reminder types (CONTRACTS.md Section 2
    // requirement #5), per patient.
    await cacheReminders([
      {
        id: crypto.randomUUID(),
        patient_id: patient.id,
        type: 'medicine',
        time: '08:00',
        recurrence: 'daily',
        message: 'Time for your morning medicine.',
        voice_note_url: null
      },
      {
        id: crypto.randomUUID(),
        patient_id: patient.id,
        type: 'hydration',
        time: '11:00',
        recurrence: 'daily',
        message: 'Please have a glass of water.',
        voice_note_url: null
      },
      {
        id: crypto.randomUUID(),
        patient_id: patient.id,
        type: 'activity',
        time: '16:00',
        recurrence: 'daily',
        message: 'Time for a short walk or some gentle stretching.',
        voice_note_url: null
      },
      {
        id: crypto.randomUUID(),
        patient_id: patient.id,
        type: 'appointment',
        time: '10:00',
        recurrence: 'once',
        message: 'Doctor visit at the community health centre.',
        voice_note_url: null
      }
    ])
  }
}