import { useState } from "react";
import { api, setToken, setStoredUser } from "../api/client";
import "./Login.css";

const PATIENT_APP_URL = import.meta.env.VITE_PATIENT_APP_URL || "http://localhost:5173";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "signup" — signup route previously didn't exist at all
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("family");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function toggleMode() {
    setMode(m => (m === "login" ? "signup" : "login"));
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = mode === "signup"
        ? await api.signup(name, email, password, role)
        : await api.login(email, password, role);
      setToken(data.token);
      setStoredUser(data.user);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="caregiver-login-screen">
      <div className="caregiver-login-panel">
        <div className="caregiver-login-mark">S</div>
        <p className="caregiver-login-kicker">SAHAY</p>
        <h1 className="caregiver-login-title">Caregiver space</h1>
        <p className="caregiver-login-subtitle">A quiet place to follow the people you care for.</p>

        <form onSubmit={handleSubmit} className="caregiver-login-form">
          {mode === "signup" && (
            <>
              <label htmlFor="signup-name">Full name</label>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </>
          )}

          <label htmlFor="login-role">Role</label>
          <select id="login-role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="family">Family</option>
            <option value="asha_worker">ASHA Worker</option>
          </select>

          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "signup" ? 8 : undefined}
          />
          {mode === "signup" && (
            <small className="caregiver-login-hint">
              At least 8 characters.
            </small>
          )}

          {error && <p className="caregiver-login-error" role="alert">{error}</p>}

          <button type="submit" disabled={loading} className="caregiver-login-submit">
            {loading ? (mode === "signup" ? "Creating account..." : "Logging in...") : (mode === "signup" ? "Create account" : "Log In")}
          </button>

          <button type="button" onClick={toggleMode} className="caregiver-login-toggle">
            {mode === "signup" ? "Already have an account? Log in" : "New here? Create an account"}
          </button>
        </form>

        <div className="caregiver-patient-link">
          <span>Looking for the Patient App?</span>
          <a href={PATIENT_APP_URL}>
            Open SAHAY Patient App <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </main>
  );
}
