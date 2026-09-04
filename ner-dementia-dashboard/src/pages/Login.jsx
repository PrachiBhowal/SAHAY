import { useState } from "react";
import { api, setToken } from "../api/client";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("family");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await mockLogin(email, password, role);
      setToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
  e.preventDefault();
  setError(null);
  setLoading(true);
  try {
    const data = await api.login(email, password, role);
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
          <label style={styles.label}>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={styles.input}>
            <option value="family">Family</option>
            <option value="asha_worker">ASHA Worker</option>
          </select>

          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
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
    padding: "56px 48px",
    borderRadius: 20,
    width: 460,
    maxWidth: "100%",
    boxShadow: "0 12px 40px rgba(74,50,38,0.15)",
    borderTop: "6px solid var(--color-terracotta)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  logoMark: {
    width: 88,
    height: 88,
    borderRadius: "50%",
    background: "var(--color-terracotta)",
    color: "#fff",
    fontSize: 38,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    boxShadow: "0 8px 24px rgba(193,101,47,0.35)",
  },
  brand: {
    color: "var(--color-brown)",
    fontSize: 38,
    margin: 0,
    letterSpacing: 1,
    fontWeight: 700,
  },
  subtitle: {
    color: "var(--color-sage)",
    fontSize: 16,
    marginTop: 8,
    marginBottom: 36,
  },
  form: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  label: { color: "var(--color-brown)", fontWeight: 600, fontSize: 16, textAlign: "left" },
  input: {
    minHeight: 60,
    fontSize: 19,
    padding: "0 16px",
    border: "2px solid var(--color-sage)",
    borderRadius: 10,
    background: "var(--color-background)",
    color: "var(--color-charcoal)",
  },
  button: {
    minHeight: 60,
    background: "var(--color-terracotta)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 20,
    fontWeight: 600,
    marginTop: 10,
    cursor: "pointer",
  },
  error: { color: "#B23A2F", fontSize: 14 },
};