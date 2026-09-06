const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

let authToken = null;

export function setToken(token) {
  authToken = token;
}

export function clearToken() {
  authToken = null;
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Server error — please try again");
  }

  if (!res.ok || data.error) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export const api = {
  login: (email, password, role) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    }),
  signup: (name, email, password, role) =>
    request("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role }),
    }),
  linkPatient: (patientId) => request("/auth/link-patient", {
    method: "POST",
    body: JSON.stringify({ patient_id: patientId }),
  }),
  getPatient: (patientId) => request(`/patients/${patientId}`),
  updatePatient: (patientId, difficultyTiers) => request(`/patients/${patientId}`, {
    method: "PATCH",
    body: JSON.stringify({ difficulty_tiers: difficultyTiers }),
  }),
  getSessions: (patientId, range = "week") =>
    request(`/patients/${patientId}/sessions?range=${range}`),
  getAlerts: (patientId) => request(`/patients/${patientId}/alerts`),
  resolveAlert: (patientId, alertId, resolved = true) =>
    request(`/patients/${patientId}/alerts/${alertId}`, {
      method: "PATCH",
      body: JSON.stringify({ resolved }),
    }),
  getReminders: (patientId) => request(`/patients/${patientId}/reminders`),
  createReminder: (patientId, body) =>
    request(`/patients/${patientId}/reminders`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateReminder: (patientId, reminderId, body) =>
    request(`/patients/${patientId}/reminders/${reminderId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteReminder: (patientId, reminderId) =>
    request(`/patients/${patientId}/reminders/${reminderId}`, { method: "DELETE" }),
  getMemoryAssets: (patientId) => request(`/patients/${patientId}/memory-assets`),
};