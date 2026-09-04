import { useState } from "react";
import "./styles/tokens.css";
import Login from "./pages/Login";
import { clearToken } from "./api/client";
import PatientOverview from "./components/PatientOverview";
import WeeklyGameTypeChart from "./components/WeeklyGameTypeChart";
import MonthlyAnalyticsChart from "./components/MonthlyAnalyticsChart";
import EngagementChart from "./components/EngagementChart";
import RemindersPanel from "./components/RemindersPanel";
import PatientsList from "./components/PatientsList";

const defaultPatient = { id: "p1", name: "Rina Devi", region_village: "Nagaon, Assam" };

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [activePatient, setActivePatient] = useState(defaultPatient);

  if (!user) return <Login onLogin={setUser} />;

  const isAsha = user.role === "asha_worker";

  const navItems = [
    { id: "overview", label: "Overview" },
    { id: "reminders", label: "Reminders" },
    { id: "alerts", label: "Alerts" },
    ...(isAsha ? [{ id: "patients", label: "Patients" }] : []),
  ];

  function handleSelectPatient(patient) {
    setActivePatient(patient);
    setActiveTab("overview"); // jump straight to that patient's overview
  }

  function handleLogout() {
    clearToken();
    setUser(null);
    setActiveTab("overview");
    setActivePatient(defaultPatient);
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

        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <PatientOverview />
            <WeeklyGameTypeChart />
            <MonthlyAnalyticsChart />
            <EngagementChart />
          </div>
        )}

        {activeTab === "reminders" && <RemindersPanel />}

        {activeTab === "alerts" && (
          <div style={styles.placeholderCard}>
            <h2 style={{ color: "var(--color-brown)" }}>Alerts</h2>
            <p style={{ color: "var(--color-sage)" }}>Not built yet — coming soon.</p>
          </div>
        )}

        {activeTab === "patients" && isAsha && (
          <PatientsList activePatientId={activePatient.id} onSelect={handleSelectPatient} />
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