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
  getSessions: (patientId, range = "week") =>
    request(`/patients/${patientId}/sessions?range=${range}`),
};