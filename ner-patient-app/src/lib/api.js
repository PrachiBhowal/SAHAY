const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const TOKEN_KEY = 'sahay_patient_auth_token'

export function getAuthToken() {
  return window.localStorage.getItem(TOKEN_KEY)
}

export function clearAuthToken() {
  window.localStorage.removeItem(TOKEN_KEY)
}

export function getDashboardUrl() {
  return import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5174'
}

async function request(path, options = {}) {
  const token = getAuthToken()
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.error) {
    throw new Error(data.message || `Request failed (${response.status})`)
  }
  return data
}

export const api = {
  async loginPatient(patientId) {
    const deviceToken = import.meta.env.VITE_PATIENT_DEVICE_TOKEN || `patient-demo-token-${patientId}`
    const data = await request('/auth/patient-login', {
      method: 'POST',
      body: JSON.stringify({ patient_id: patientId, device_token: deviceToken })
    })
    window.localStorage.setItem(TOKEN_KEY, data.token)
    return data
  },
  getAvailablePatients: () => request('/auth/available-patients'),
  getPatient: (patientId) => request(`/patients/${patientId}`),
  getReminders: (patientId) => request(`/patients/${patientId}/reminders`),
  getMemoryAssets: (patientId) => request(`/patients/${patientId}/memory-assets`),
  sync: (patientId, queuedSessions, queuedAlerts) => request('/sync', {
    method: 'POST',
    body: JSON.stringify({ patient_id: patientId, queued_sessions: queuedSessions, queued_alerts: queuedAlerts })
  }),
  updatePatient: (patientId, difficultyTiers) => request(`/patients/${patientId}`, {
    method: 'PATCH',
    body: JSON.stringify({ difficulty_tiers: difficultyTiers })
  })
}