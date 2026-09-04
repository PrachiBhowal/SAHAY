const dummyPatient = {
  id: "p1",
  name: "Rina Devi",
  language_pref: "as",
  region_village: "Nagaon, Assam",
  difficulty_tiers: {
    memory: 3,
    attention: 2,
    recall: 3,
    pattern: 2,
  },
  created_at: "2026-08-10T09:00:00Z",
};

const dummyLastActive = "2026-08-27T17:42:00Z";

const gameLabels = {
  memory: "Memory",
  attention: "Attention",
  recall: "Recall",
  pattern: "Pattern",
};

function formatLastActive(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffHours = Math.round((now - date) / (1000 * 60 * 60));
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function PatientOverview({ patient = dummyPatient, lastActive = dummyLastActive }) {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.name}>{patient.name}</h2>
          <p style={styles.meta}>{patient.region_village}</p>
        </div>
        <div style={styles.lastActiveBadge}>
          Last active: {formatLastActive(lastActive)}
        </div>
      </div>

      <div style={styles.tierGrid}>
        {Object.entries(patient.difficulty_tiers).map(([gameType, tier]) => (
          <div key={gameType} style={styles.tierCard}>
            <span style={styles.tierLabel}>{gameLabels[gameType]}</span>
            <span style={styles.tierValue}>Tier {tier}</span>
            <div style={styles.tierBar}>
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  style={{
                    ...styles.tierSegment,
                    background: n <= tier ? "var(--color-terracotta)" : "var(--color-background)",
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: 14,
    padding: 24,
    boxShadow: "0 4px 16px rgba(74,50,38,0.08)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  name: { color: "var(--color-brown)", fontSize: "var(--font-size-lg)", margin: 0 },
  meta: { color: "var(--color-sage)", fontSize: 15, margin: "4px 0 0" },
  lastActiveBadge: {
    background: "var(--color-background)",
    color: "var(--color-brown)",
    padding: "8px 14px",
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 600,
  },
  tierGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
  },
  tierCard: {
    background: "var(--color-background)",
    borderRadius: 10,
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  tierLabel: { color: "var(--color-brown)", fontSize: 14, fontWeight: 600 },
  tierValue: { color: "var(--color-charcoal)", fontSize: 20, fontWeight: 700 },
  tierBar: { display: "flex", gap: 4, marginTop: 4 },
  tierSegment: { height: 6, flex: 1, borderRadius: 3 },
};