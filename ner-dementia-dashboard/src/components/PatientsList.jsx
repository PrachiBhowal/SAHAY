const dummyPatients = [
  {
    id: "p1",
    name: "Rina Devi",
    language_pref: "as",
    region_village: "Nagaon, Assam",
    last_active: "2026-08-27T17:42:00Z",
  },
  {
    id: "p2",
    name: "Bipul Saikia",
    language_pref: "as",
    region_village: "Jorhat, Assam",
    last_active: "2026-08-28T09:15:00Z",
  },
  {
    id: "p3",
    name: "Anima Baruah",
    language_pref: "as",
    region_village: "Sivasagar, Assam",
    last_active: "2026-08-25T14:00:00Z",
  },
];

function formatLastActive(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffHours = Math.round((now - date) / (1000 * 60 * 60));
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.round(diffHours / 24)}d ago`;
}

export default function PatientsList({ patients = dummyPatients, activePatientId, onSelect }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 4px 16px rgba(74,50,38,0.08)" }}>
      <h2 style={{ color: "var(--color-brown)", fontSize: "var(--font-size-lg)", marginTop: 0, marginBottom: 16 }}>
        My Patients
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {patients.map((p) => {
          const isActive = p.id === activePatientId;
          return (
            <div
              key={p.id}
              onClick={() => onSelect(p)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 16px",
                borderRadius: 10,
                cursor: "pointer",
                background: isActive ? "var(--color-terracotta)" : "var(--color-background)",
                color: isActive ? "#fff" : "var(--color-charcoal)",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{p.name}</div>
                <div style={{ fontSize: 14, opacity: 0.8 }}>{p.region_village}</div>
              </div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                {isActive ? "Currently viewing" : `Last active ${formatLastActive(p.last_active)}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}