import { useState } from 'react'
import { api } from '../lib/api'
import './AndroidShell.css'

export default function CaregiverPortalModal({ patient, onClose, onSwitchPatient, onTriggerSync, syncStatus }) {
    const [caregiverCode, setCaregiverCode] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [linking, setLinking] = useState(false)
    const [syncing, setSyncing] = useState(false)

    async function linkCaregiver(event) {
        event.preventDefault()
        if (!caregiverCode.trim()) return
        setLinking(true)
        setMessage('')
        setError('')
        try {
            await api.linkCaregiver(caregiverCode.trim())
            setMessage('Caregiver connected.')
            setCaregiverCode('')
        } catch (linkError) {
            setError(linkError.message || 'We could not connect that caregiver.')
        } finally {
            setLinking(false)
        }
    }

    async function syncNow() {
        setSyncing(true)
        setError('')
        try {
            const result = await onTriggerSync()
            setMessage(result.syncedCount ? `${result.syncedCount} activities synced.` : 'Everything is up to date.')
        } catch (syncError) {
            setError(syncError.message || 'Sync is unavailable right now.')
        } finally {
            setSyncing(false)
        }
    }

    return (
        <div className="android-modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
            <section className="android-portal-modal" role="dialog" aria-modal="true" aria-labelledby="portal-title">
                <div className="android-modal-header">
                    <div>
                        <p className="android-modal-kicker">Account</p>
                        <h2 id="portal-title">Your SAHAY space</h2>
                    </div>
                    <button type="button" className="android-modal-close" onClick={onClose} aria-label="Close">&#10005;</button>
                </div>

                <div className="android-identity-card">
                    <span>Your patient ID</span>
                    <strong>{patient?.id}</strong>
                    <small>Share this ID with a caregiver so they can add you.</small>
                </div>

                <form className="android-link-caregiver-form" onSubmit={linkCaregiver}>
                    <label htmlFor="caregiver-link-code">Connect a caregiver</label>
                    <input
                        id="caregiver-link-code"
                        value={caregiverCode}
                        onChange={event => setCaregiverCode(event.target.value)}
                        placeholder="Enter caregiver code"
                        autoComplete="off"
                    />
                    <button type="submit" disabled={linking || !caregiverCode.trim()}>{linking ? 'Connecting...' : 'Connect caregiver'}</button>
                </form>

                <div className="android-sync-row">
                    <span>{syncStatus === 'offline' ? 'Offline' : 'Connected'}</span>
                    <button type="button" onClick={syncNow} disabled={syncing}>{syncing ? 'Syncing...' : 'Sync now'}</button>
                </div>

                {message && <p className="android-portal-message" role="status">{message}</p>}
                {error && <p className="android-portal-error" role="alert">{error}</p>}

                <div className="android-modal-footer">
                    <button type="button" onClick={onSwitchPatient}>Switch patient</button>
                    <button type="button" onClick={onClose}>Done</button>
                </div>
            </section>
        </div>
    )
}
