import { useState } from "react";
import { api, setToken } from "../api/client";

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
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.logoMark}>S</div>
        <h1 style={styles.brand}>SAHAY</h1>
        <p style={styles.subtitle}>Caregiver & ASHA Worker Login</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === "signup" && (
            <>
              <label htmlFor="signup-name" style={styles.label}>Full name</label>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                required
              />
            </>
          )}

          <label htmlFor="login-role" style={styles.label}>Role</label>
          <select id="login-role" value={role} onChange={(e) => setRole(e.target.value)} style={styles.input}>
            <option value="family">Family</option>
            <option value="asha_worker">ASHA Worker</option>
          </select>

          <label htmlFor="login-email" style={styles.label}>Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />

          <label htmlFor="login-password" style={styles.label}>Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
            minLength={mode === "signup" ? 8 : undefined}
          />
          {mode === "signup" && (
            <small style={{ color: "var(--color-text-muted, #8A7A66)", marginTop: -6 }}>
              At least 8 characters.
            </small>
          )}

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? (mode === "signup" ? "Creating account..." : "Logging in...") : (mode === "signup" ? "Create account" : "Log In")}
          </button>

          <button type="button" onClick={toggleMode} style={styles.linkButton}>
            {mode === "signup" ? "Already have an account? Log in" : "New here? Create an account"}
          </button>
        </form>

        <div style={styles.patientLinkWrapper}>
          <span>Looking for the Patient App?</span>
          <a href={PATIENT_APP_URL} style={styles.patientLink}>
            Open SAHAY Patient App →
          </a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  patientLinkWrapper: {
    marginTop: 20,
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    fontSize: 14,
    color: "var(--color-text-muted, #8A7A66)",
  },
  patientLink: {
    color: "var(--color-terracotta)",
    fontWeight: 700,
    textDecoration: "none",
  },
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(160deg, #F6EFE4 0%, #EFE3D0 50%, #E9DCC3 100%)",
    padding: 24,
  },

  card: {
    background: "#fff",
    padding: "28px 28px",
    borderRadius: 20,
    width: 340,
    maxWidth: "100%",
    boxShadow: "0 12px 40px rgba(74,50,38,0.15)",
    borderTop: "6px solid var(--color-terracotta)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  logoMark: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "var(--color-terracotta)",
    color: "#fff",
    fontSize: 28,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    boxShadow: "0 8px 24px rgba(193,101,47,0.35)",
  },
  brand: {
    color: "var(--color-brown)",
    fontSize: 28,
    margin: 0,
    letterSpacing: 1,
    fontWeight: 700,
  },
  subtitle: {
    color: "var(--color-sage)",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 20,
  },
  form: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  label: { color: "var(--color-brown)", fontWeight: 600, fontSize: 14, textAlign: "left" },
  input: {
    minHeight: 52,
    fontSize: 16,
    padding: "0 12px",
    border: "2px solid var(--color-sage)",
    borderRadius: 10,
    background: "var(--color-background)",
    color: "var(--color-charcoal)",
  },
  button: {
    minHeight: 52,
    background: "var(--color-terracotta)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 18,
    fontWeight: 600,
    marginTop: 10,
    cursor: "pointer",
  },
  error: { color: "#B23A2F", fontSize: 14 },
  linkButton: {
    background: "none",
    border: "none",
    color: "var(--color-terracotta)",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    marginTop: 4,
    minHeight: "auto",
    padding: 0,
  },
};