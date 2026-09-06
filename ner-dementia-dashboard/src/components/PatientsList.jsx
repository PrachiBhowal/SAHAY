import { useState, useEffect } from "react";
import { api } from "../api/client";

function formatLastActive(isoString) {
  if (!isoString) return "No activity yet";
  const date = new Date(isoString);
  const now = new Date();
  const diffHours = Math.round((now - date) / (1000 * 60 * 60));
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.round(diffHours / 24)}d ago`;
}

const PATIENT_APP_URL = import.meta.env.VITE_PATIENT_APP_URL || "http://localhost:5173";

export default function PatientsList({ patients = [], activePatientId, onSelect }) {
  // patient_id -> open alert count. Fetched here rather than passed down,
  // so this component works standalone regardless of what else App.jsx loads.
  const [alertCounts, setAlertCounts] = useState({});

  useEffect(() => {
    if (patients.length === 0) return;
    let cancelled = false;

    Promise.all(
      patients.map((p) =>
        api
          .getAlerts(p.id)
          .then((alerts) => [p.id, alerts.filter((a) => !a.resolved).length])
          .catch(() => [p.id, 0]) // don't let one failed fetch break the whole list
      )
    ).then((entries) => {
      if (!cancelled) setAlertCounts(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [patients]);

  if (patients.length === 0) {
    return (
      <div style={styles.card}>
        <h2 style={styles.title}>My Patients</h2>
        <p style={{ color: "var(--color-sage)" }}>No patients linked to this account yet.</p>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>My Patients</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {patients.map((p) => {
          const isActive = p.id === activePatientId;
          const openAlerts = alertCounts[p.id] || 0;
          return (
            <div
              key={p.id}
              onClick={() => onSelect(p)}
              style={{
                ...styles.row,
                background: isActive ? "var(--color-terracotta)" : "var(--color-background)",
                color: isActive ? "#fff" : "var(--color-charcoal)",
                cursor: "pointer",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 17 }}>{p.name}</span>
                  <span
                    style={{
                      ...styles.patientId,
                      color: isActive ? "rgba(255, 255, 255, 0.86)" : styles.patientId.color,
                    }}
                  >
                    ID: {p.id}
                  </span>
                  {openAlerts > 0 && (
                    <span
                      style={{
                        ...styles.alertBadge,
                        background: isActive ? "#fff" : "#B23A2F",
                        color: isActive ? "#B23A2F" : "#fff",
                      }}
                    >
                      {openAlerts} open
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 14, opacity: 0.8 }}>{p.region_village}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  {isActive ? "Currently viewing" : `Last active ${formatLastActive(p.last_active)}`}
                </div>
                <a
                  href={`${PATIENT_APP_URL}/?patientId=${p.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: isActive ? "rgba(255,255,255,0.28)" : "var(--color-ochre)",
                    color: isActive ? "#fff" : "#3A2E24",
                    padding: "6px 14px",
                    borderRadius: 14,
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                  title={`Open SAHAY Patient App for ${p.name}`}
                >
                  🎮 Open Patient Mode ↗
                </a>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

const styles = {
  card: { background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 4px 16px rgba(74,50,38,0.08)" },
  title: { color: "var(--color-brown)", fontSize: "var(--font-size-lg)", marginTop: 0, marginBottom: 16 },
  row: {
    width: "100%",
    border: "none",
    textAlign: "left",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    borderRadius: 10,
    cursor: "pointer",
  },
  patientId: {
    color: "var(--color-text-muted)",
    fontSize: 12,
    fontWeight: 600,
    overflowWrap: "anywhere",
  },
  alertBadge: { fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10 },
};