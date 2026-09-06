// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'
import { seedDevData } from './lib/devSeed'
import { getPatientData, getPendingSyncItems, clearSyncQueueItem, savePatientData, cacheReminders, cacheMemoryAssets, setActivePatientId, getActivePatientId } from './lib/localStorage'
import { bootstrapDifficultyEngine } from './lib/difficultyBootstrap'

import { api } from './lib/api'
import { AccessibilityProvider } from './design-system/AccessibilityContext'
import { SundownProvider } from './sundown/SundownContext'
import './tokens.css'

function setSyncStatus(status) {
    window.localStorage.setItem('sahay_sync_status', status)
    window.dispatchEvent(new CustomEvent('sahay-sync-status', { detail: status }))
}

registerSW({
    onOfflineReady() { console.log('App ready to work offline.') }
})

async function flushSyncQueue() {
    const patient = await getPatientData()
    if (!patient) return

    const pending = await getPendingSyncItems()
    const queuedSessions = pending
        .filter(p => p.type === 'session' || (!p.type && p.item && 'game_type' in p.item))
        .map(p => p.item)
    const queuedAlerts = pending
        .filter(p => p.type === 'alert' || (!p.type && p.item && 'trigger_type' in p.item))
        .map(p => p.item)
    const queuedMemoryAssets = pending
        .filter(p => p.type === 'memory_asset')
        .map(p => p.item)

    if (queuedSessions.length === 0 && queuedAlerts.length === 0 && queuedMemoryAssets.length === 0) return { syncedCount: 0 }

    const result = await api.sync(patient.id, queuedSessions, queuedAlerts, queuedMemoryAssets)
    const failedIds = new Set(result.failed.map(item => item.id))
    await Promise.all(
        pending
            .filter(item => item.type === 'session' || item.type === 'alert' || item.type === 'memory_asset')
            .filter(item => !failedIds.has(item.item.id))
            .map(item => clearSyncQueueItem(item.id))
    )
    return result
}

export async function syncPatient(patientId) {
    if (!patientId) return null
    try {
        const [remotePatient, reminders, memoryAssets] = await Promise.all([
            api.getPatient(patientId),
            api.getReminders(patientId),
            api.getMemoryAssets(patientId)
        ])
        await savePatientData(remotePatient)
        await cacheReminders(reminders)
        await cacheMemoryAssets(memoryAssets)
        await flushSyncQueue()
        setSyncStatus('online')
        return remotePatient
    } catch (error) {
        console.warn('[patient-app] sync unavailable; keeping data queued:', error)
        setSyncStatus('offline')
        return null
    }
}

async function bootstrap() {
    const existing = await getPatientData()
    if (!existing) {
        await seedDevData()
    }

    const urlParams = new URLSearchParams(window.location.search)
    const paramPatientId = urlParams.get('patientId')
    if (paramPatientId) {
        setActivePatientId(paramPatientId)
    }


    const activePatient = await getPatientData()
    if (activePatient) {
        await syncPatient(activePatient.id)
        await bootstrapDifficultyEngine(activePatient.id)
    }

    window.addEventListener('online', async () => {
        try {
            const onlinePatient = await getPatientData()
            if (onlinePatient) {
                await syncPatient(onlinePatient.id)
            }
        } catch (error) {
            console.warn('[patient-app] online sync unavailable:', error)
            setSyncStatus('offline')
        }
    })


    createRoot(document.getElementById('root')).render(
        <StrictMode>
            <AccessibilityProvider>
                <SundownProvider>
                    <App />
                </SundownProvider>
            </AccessibilityProvider>
        </StrictMode>
    )
}

bootstrap()
