import { useState, useEffect, useMemo } from "react";
import { AlertTriangle, BellOff, Clock } from "lucide-react";
import { api } from "../api/client";

// Presentation-only mapping — NOT part of CONTRACTS.md's AlertLog shape,
// which is just { id, patient_id, trigger_type, timestamp, resolved }.
const TRIGGER_META = {
  manual_distress: {
    label: "Manual Distress Signal",
    message: "Patient or caregiver flagged distress",
    style: { bg: "#FDECEC", border: "#F5B5B0", text: "#B23A2F", dot: "#B23A2F" },
  },
  low_engagement: {
    label: "Low Engagement",
    message: "3 consecutive low-engagement sessions detected",
    style: { bg: "#FBF2DE", border: "#E9CB8C", text: "#8A6A1F", dot: "#D9A441" },
  },
  missed_session: {
    label: "Missed Session",
    message: "Patient missed a scheduled session",
    style: { bg: "#EAF0E7", border: "#B9C7AE", text: "#4E6142", dot: "#8A9A7B" },
  },
};

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AlertsPanel({ patientId }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!patientId) {
      setAlerts([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .getAlerts(patientId)
      .then((data) => {
        if (!cancelled) setAlerts(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const filtered = useMemo(() => {
    let list = [...alerts];
    if (filter === "unresolved") list = list.filter((a) => !a.resolved);
    else if (filter !== "all") list = list.filter((a) => a.trigger_type === filter);
    return list.sort((a, b) => {
      if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }, [alerts, filter]);

  const unresolvedCount = alerts.filter((a) => !a.resolved).length;

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={18} color="var(--color-brown)" />
          <h2 style={styles.title}>Alerts</h2>
          {unresolvedCount > 0 && <span style={styles.countBadge}>{unresolvedCount} open</span>}
        </div>

        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={styles.select}>
          <option value="all">All</option>
          <option value="unresolved">Unresolved</option>
          <option value="low_engagement">Low Engagement</option>
          <option value="manual_distress">Manual Distress</option>
          <option value="missed_session">Missed Session</option>
        </select>
      </div>

      {loading && <p style={styles.muted}>Loading alerts…</p>}
      {error && <p style={styles.errorText}>Couldn't load alerts: {error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <div style={styles.emptyState}>
          <BellOff size={28} color="var(--color-sage)" />
          <p style={styles.muted}>No alerts to show</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflowY: "auto" }}>
          {filtered.map((alert) => {
            const meta = TRIGGER_META[alert.trigger_type] || {
              label: alert.trigger_type,
              message: "",
              style: TRIGGER_META.missed_session.style,
            };
            return (
              <div
                key={alert.id}
                style={{
                  ...styles.alertRow,
                  background: meta.style.bg,
                  borderColor: meta.style.border,
                  opacity: alert.resolved ? 0.5 : 1,
                }}
              >
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ ...styles.dot, background: meta.style.dot }} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ ...styles.triggerLabel, color: meta.style.text }}>{meta.label}</span>
                      <span style={styles.timeAgo}>
                        <Clock size={10} /> {timeAgo(alert.timestamp)}
                      </span>
                    </div>
                    <p style={styles.message}>{meta.message}</p>
                  </div>
                </div>
                {/* TODO: CONTRACTS.md has no endpoint to flip `resolved` yet —
                    flag to Person 5. Read-only until then. */}
                {!alert.resolved && <span style={styles.openTag}>open</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: { background: "#fff", borderRadius: 14, padding: 24, boxShadow: "0 4px 16px rgba(74,50,38,0.08)" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { color: "var(--color-brown)", fontSize: 20, margin: 0 },
  countBadge: { fontSize: 12, fontWeight: 600, background: "#FDECEC", color: "#B23A2F", padding: "2px 10px", borderRadius: 12 },
  select: { fontSize: 14, border: "1px solid var(--color-sage)", borderRadius: 8, padding: "6px 10px", color: "var(--color-brown)" },
  muted: { color: "var(--color-sage)", fontSize: 14, textAlign: "center", padding: "16px 0" },
  errorText: { color: "#B23A2F", fontSize: 14, padding: "16px 0" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "24px 0" },
  alertRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, padding: 12, borderRadius: 10, border: "1px solid" },
  dot: { width: 8, height: 8, borderRadius: "50%", marginTop: 6, flexShrink: 0 },
  triggerLabel: { fontSize: 12, fontWeight: 700 },
  timeAgo: { fontSize: 11, color: "#999", display: "flex", alignItems: "center", gap: 4 },
  message: { fontSize: 14, color: "var(--color-text)", margin: "4px 0 0" },
  openTag: { fontSize: 11, color: "#999", fontStyle: "italic", flexShrink: 0 },
};