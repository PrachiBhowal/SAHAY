// add to src/lib/localStorage.js

/**
 * Returns all locally stored GameSessions for a patient, most recent
 * first. Used to hydrate Person 4's performanceTracker on app start so
 * the rolling window isn't empty after every reload.
 */
export async function getSessionsForPatient(patientId) {
  const db = await getDB()
  const all = await db.getAllFromIndex(STORES.GAME_SESSIONS, 'patient_id', patientId)
  return all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}import { openDB } from 'idb'

const DB_NAME = 'ner_care_app'
const DB_VERSION = 1

export const STORES = {
  PATIENT: 'patient',
  GAME_SESSIONS: 'game_sessions',
  REMINDERS: 'reminders',
  MEMORY_ASSETS: 'memory_assets',
  SYNC_QUEUE: 'sync_queue'
}

let dbPromise = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORES.PATIENT)) {
          db.createObjectStore(STORES.PATIENT, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(STORES.GAME_SESSIONS)) {
          const store = db.createObjectStore(STORES.GAME_SESSIONS, { keyPath: 'id' })
          store.createIndex('synced', 'synced')
          store.createIndex('patient_id', 'patient_id')
        }
        if (!db.objectStoreNames.contains(STORES.REMINDERS)) {
          db.createObjectStore(STORES.REMINDERS, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(STORES.MEMORY_ASSETS)) {
          db.createObjectStore(STORES.MEMORY_ASSETS, { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true })
        }
      }
    })
  }
  return dbPromise
}

/**
 * Saves a GameSession locally. Field names match the CONTRACTS.md schema
 * exactly (snake_case) so sync to backend is a straight push, no mapping.
 * synced: false until /sync confirms it — per contract, never delete
 * unsynced data.
 */
export async function saveSession(session) {
  const db = await getDB()
  const record = {
    ...session,
    synced: false
  }
  await db.put(STORES.GAME_SESSIONS, record)
  await queueForSync(record)
  return record
}

/**
 * Marks a session as synced after backend confirms via /sync.
 * Person 5's sync engine calls this — not deleting, just flipping the flag.
 */
export async function markSessionSynced(sessionId) {
  const db = await getDB()
  const session = await db.get(STORES.GAME_SESSIONS, sessionId)
  if (session) {
    session.synced = true
    await db.put(STORES.GAME_SESSIONS, session)
  }
}

/**
 * Returns the single patient record for this device.
 */
export async function getPatientData() {
  const db = await getDB()
  const all = await db.getAll(STORES.PATIENT)
  return all[0] || null
}

export async function savePatientData(patient) {
  const db = await getDB()
  await db.put(STORES.PATIENT, patient)
}

/**
 * Adds a GameSession or AlertLog to the pending sync queue.
 * Person 5's background sync reads from here when connectivity returns.
 */
export async function queueForSync(item) {
  const db = await getDB()
  await db.add(STORES.SYNC_QUEUE, {
    item,
    queued_at: new Date().toISOString()
  })
}

export async function getPendingSyncItems() {
  const db = await getDB()
  return db.getAll(STORES.SYNC_QUEUE)
}

export async function clearSyncQueueItem(queueId) {
  const db = await getDB()
  await db.delete(STORES.SYNC_QUEUE, queueId)
}

/**
 * Reminders + memory assets are cached copies pulled from backend on sync,
 * per contract Section 5.
 */
export async function cacheReminders(reminders) {
  const db = await getDB()
  const tx = db.transaction(STORES.REMINDERS, 'readwrite')
  await Promise.all(reminders.map(r => tx.store.put(r)))
  await tx.done
}

export async function getReminders(patientId) {
  const db = await getDB()
  const all = await db.getAll(STORES.REMINDERS)
  return all.filter(r => r.patient_id === patientId)
}

export async function cacheMemoryAssets(assets) {
  const db = await getDB()
  const tx = db.transaction(STORES.MEMORY_ASSETS, 'readwrite')
  await Promise.all(assets.map(a => tx.store.put(a)))
  await tx.done
}

export async function getMemoryAssets(patientId) {
  const db = await getDB()
  const all = await db.getAll(STORES.MEMORY_ASSETS)
  return all.filter(a => a.patient_id === patientId)
}

export async function saveMemoryAsset(asset) {
  const db = await getDB()
  await db.put(STORES.MEMORY_ASSETS, asset)
  await queueForSync(asset)
  return asset
}