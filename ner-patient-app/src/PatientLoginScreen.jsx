import { useState } from 'react'
import { api } from './lib/api'
import { savePatientData, setActivePatientId } from './lib/localStorage'
import './PatientLoginScreen.css'

export default function PatientLoginScreen({ onSelectPatient }) {
    const [mode, setMode] = useState('login')
    const [patientId, setPatientId] = useState('')
    const [name, setName] = useState('')
    const [language, setLanguage] = useState('en')
    const [region, setRegion] = useState('')
    const [caregiverCode, setCaregiverCode] = useState('')
    const [accessCode, setAccessCode] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [createdAccount, setCreatedAccount] = useState(null)

    function switchMode(nextMode) {
        setMode(nextMode)
        setError('')
        setAccessCode('')
        setCreatedAccount(null)
    }

    async function handleSubmit(event) {
        event.preventDefault()
        if (!accessCode.trim() || (mode === 'login' ? !patientId.trim() : !name.trim())) return

        setSubmitting(true)
        setError('')
        try {
            if (mode === 'signup') {
                const result = await api.signupPatient({
                    name: name.trim(),
                    language_pref: language,
                    region_village: region.trim(),
                    access_code: accessCode.trim(),
                    caregiver_code: caregiverCode.trim() || undefined
                })
                const profile = await api.getPatient(result.patient_id)
                await savePatientData(profile)
                setCreatedAccount({ id: result.patient_id, profile })
                return
            }

            await api.loginPatient(patientId.trim(), accessCode.trim())
            const profile = await api.getPatient(patientId.trim())
            await savePatientData(profile)
            setActivePatientId(profile.id)
            onSelectPatient(profile)
        } catch (loginError) {
            setError(loginError.message || 'That access code was not recognised.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <main className="patient-login-screen">
            <section className="patient-login-panel" aria-labelledby="patient-login-title">
                <div className="patient-login-mark" aria-hidden="true">S</div>
                <p className="patient-login-kicker">SAHAY</p>
                {createdAccount ? (
                    <>
                        <h1 id="patient-login-title">Your account is ready</h1>
                        <p className="patient-login-intro">Keep this patient ID safe. Your caregiver uses it to connect you to their dashboard.</p>
                        <div className="patient-created-id">
                            <span>Your patient ID</span>
                            <strong>{createdAccount.id}</strong>
                        </div>
                        <button className="patient-login-submit" type="button" onClick={() => {
                            setActivePatientId(createdAccount.profile.id)
                            onSelectPatient(createdAccount.profile)
                        }}>
                            Continue to SAHAY
                        </button>
                    </>
                ) : (
                    <>
                        <h1 id="patient-login-title">{mode === 'login' ? 'Welcome back' : 'Create your patient account'}</h1>
                        <p className="patient-login-intro">
                            {mode === 'login' ? 'Use your patient ID and personal access code.' : 'Create your own account, then share your patient ID with your caregiver.'}
                        </p>

                        <form onSubmit={handleSubmit}>
                            {mode === 'login' ? (
                                <>
                                    <label className="access-code-label" htmlFor="patient-id">Patient ID</label>
                                    <input
                                        id="patient-id"
                                        className="access-code-input"
                                        type="text"
                                        value={patientId}
                                        onChange={event => setPatientId(event.target.value)}
                                        placeholder="patient-..."
                                        autoComplete="username"
                                    />
                                </>
                            ) : (
                                <>
                                    <label className="access-code-label" htmlFor="patient-name">Your name</label>
                                    <input id="patient-name" className="access-code-input" type="text" value={name} onChange={event => setName(event.target.value)} required />
                                    <label className="access-code-label" htmlFor="patient-language">Preferred language</label>
                                    <select id="patient-language" className="access-code-input" value={language} onChange={event => setLanguage(event.target.value)}>
                                        <option value="en">English</option>
                                        <option value="as">Assamese</option>
                                        <option value="hi">Hindi</option>
                                        <option value="bn">Bengali</option>
                                    </select>
                                    <label className="access-code-label" htmlFor="patient-region">Village or town</label>
                                    <input id="patient-region" className="access-code-input" type="text" value={region} onChange={event => setRegion(event.target.value)} />
                                    <label className="access-code-label" htmlFor="caregiver-code">Caregiver code (optional)</label>
                                    <input id="caregiver-code" className="access-code-input" type="text" value={caregiverCode} onChange={event => setCaregiverCode(event.target.value)} placeholder="CG-..." autoComplete="off" />
                                </>
                            )}

                            <label className="access-code-label" htmlFor="access-code">Personal access code</label>
                            <input
                                id="access-code"
                                className="access-code-input"
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]{4,8}"
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                value={accessCode}
                                onChange={event => setAccessCode(event.target.value)}
                                placeholder="4 to 8 digits"
                                required
                                aria-describedby={error ? 'patient-login-error' : undefined}
                            />

                            {error && <p className="patient-login-error" id="patient-login-error" role="alert">{error}</p>}
                            <button className="patient-login-submit" type="submit" disabled={submitting || !accessCode.trim() || (mode === 'login' ? !patientId.trim() : !name.trim())}>
                                {submitting ? (mode === 'signup' ? 'Creating account...' : 'Signing in...') : (mode === 'signup' ? 'Create account' : 'Sign in')}
                            </button>
                        </form>
                        <button className="patient-login-toggle" type="button" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
                            {mode === 'login' ? 'New patient? Create an account' : 'Already have an account? Sign in'}
                        </button>
                    </>
                )}
            </section>
        </main>
    )
}
