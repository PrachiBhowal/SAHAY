import { useState, useEffect } from "react";
import "./styles/tokens.css";
import Login from "./pages/Login";
import { api, clearToken } from "./api/client";
import PatientOverview from "./components/PatientOverview";
import WeeklyGameTypeChart from "./components/WeeklyGameTypeChart";
import MonthlyAnalyticsChart from "./components/MonthlyAnalyticsChart";
import EngagementChart from "./components/EngagementChart";
import RemindersPanel from "./components/RemindersPanel";
import PatientsList from "./components/PatientsList";
import AlertsPanel from "./components/AlertsPanel";

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [patients, setPatients] = useState([]);
  const [activePatient, setActivePatient] = useState(null);

  const [weeklySessions, setWeeklySessions] = useState([]);
  const [monthlySessions, setMonthlySessions] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);

  // Load the caregiver's linked patients once logged in
  useEffect(() => {
    if (!user) return;
    Promise.all((user.linked_patient_ids || []).map((id) => api.getPatient(id)))
      .then((fetched) => {
        setPatients(fetched);
        setActivePatient((prev) => prev || fetched[0] || null);
      })
      .catch((err) => console.error("Failed to load patients:", err));
  }, [user]);

  // Load sessions (week + month) and reminders whenever the active patient changes
  useEffect(() => {
    if (!activePatient) return;
    let cancelled = false;
    setSessionsLoading(true);
    setSessionsError(null);

    Promise.all([
      api.getSessions(activePatient.id, "week"),
      api.getSessions(activePatient.id, "month"),
      api.getReminders(activePatient.id),
    ])
      .then(([week, month, remindersData]) => {
        if (cancelled) return;
        setWeeklySessions(week);
        setMonthlySessions(month);
        setReminders(remindersData);
      })
      .catch((err) => {
        if (!cancelled) setSessionsError(err.message);
      })
      .finally(() => {
        if (!cancelled) setSessionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activePatient]);

  if (!user) return <Login onLogin={setUser} />;
  if (!activePatient) return <div style={styles.main}>Loading patients…</div>;

  const isAsha = user.role === "asha_worker";

  const navItems = [
    { id: "overview", label: "Overview" },
    { id: "reminders", label: "Reminders" },
    { id: "alerts", label: "Alerts" },
    ...(isAsha ? [{ id: "patients", label: "Patients" }] : []),
  ];

  // Last active = most recent session timestamp (Patient in CONTRACTS.md has no last_active field)
  const lastActive = weeklySessions.length
    ? weeklySessions.reduce((latest, s) => (s.timestamp > latest ? s.timestamp : latest), weeklySessions[0].timestamp)
    : null;

  function handleSelectPatient(patient) {
    setActivePatient(patient);
    setActiveTab("overview");
  }

  function handleLogout() {
    clearToken();
    setUser(null);
    setActiveTab("overview");
    setActivePatient(null); // was: defaultPatient — that stub blocked re-fetch on next login
    setPatients([]);
  }

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarBrand}>SAHAY</div>
        <div style={styles.sidebarTagline}>NER Dementia Care</div>

        <nav style={styles.nav}>
          {navItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                ...styles.navItem,
                ...(activeTab === item.id ? styles.navItemActive : {}),
              }}
            >
              {item.label}
            </div>
          ))}
        </nav>

        <div style={styles.logoutWrapper}>
          <div onClick={handleLogout} style={styles.logoutButton}>
            Log Out
          </div>
        </div>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.welcome}>Welcome, {user.role}</h1>
          <div style={styles.badge}>Patient: {activePatient.name}</div>
        </header>

        {sessionsError && (
          <p style={{ color: "#B23A2F", marginBottom: 16 }}>
            Couldn't load session data: {sessionsError}
          </p>
        )}

        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <PatientOverview patient={activePatient} lastActive={lastActive} />
            {sessionsLoading ? (
              <p style={{ color: "var(--color-sage)" }}>Loading charts…</p>
            ) : (
              <>
                <WeeklyGameTypeChart sessions={weeklySessions} />
                <MonthlyAnalyticsChart sessions={monthlySessions} />
                <EngagementChart sessions={weeklySessions} />
              </>
            )}
          </div>
        )}

        {activeTab === "reminders" && (
          <RemindersPanel
            patientId={activePatient.id}
            reminders={reminders}
            setReminders={setReminders}
          />
        )}

        {activeTab === "alerts" && <AlertsPanel patientId={activePatient.id} />}

        {activeTab === "patients" && isAsha && (
          <PatientsList patients={patients} activePatientId={activePatient.id} onSelect={handleSelectPatient} />
        )}
      </main>
    </div>
  );
}

const styles = {
  shell: { display: "flex", minHeight: "100vh" },
  sidebar: {
    width: 220,
    background: "var(--color-brown)",
    color: "#fff",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
  sidebarBrand: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 8,
    color: "var(--color-ochre)",
  },
  sidebarTagline: {
    color: "var(--color-sage)",
    fontSize: 12,
    marginBottom: 24,
  },
  nav: { display: "flex", flexDirection: "column", gap: 8 },
  navItem: {
    padding: "12px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 16,
  },
  navItemActive: {
    background: "var(--color-terracotta)",
    fontWeight: 600,
  },
  logoutWrapper: {
    marginTop: "auto",
    paddingTop: 16,
    borderTop: "1px solid rgba(255,255,255,0.15)",
  },
  logoutButton: {
    padding: "12px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 16,
    color: "var(--color-ochre)",
    fontWeight: 600,
  },
  main: { flex: 1, padding: 32 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  welcome: { color: "var(--color-brown)", fontSize: "var(--font-size-xl)", margin: 0 },
  badge: {
    background: "var(--color-sage)",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: 20,
    fontSize: 14,
  },
  placeholderCard: {
    background: "#fff",
    borderRadius: 14,
    padding: 40,
    textAlign: "center",
    boxShadow: "0 4px 16px rgba(74,50,38,0.08)",
  },
};