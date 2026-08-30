import { useState } from "react";
import "./styles/tokens.css";
import Login from "./pages/Login";
import PatientOverview from "./components/PatientOverview";
import WeeklyGameTypeChart from "./components/WeeklyGameTypeChart";
import MonthlyAnalyticsChart from "./components/MonthlyAnalyticsChart";

export default function App() {
  const [user, setUser] = useState(null);

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div style={styles.shell}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarBrand}>SAHAY</div>
        <nav style={styles.nav}>
          <div style={{ ...styles.navItem, ...styles.navItemActive }}>Overview</div>
          <div style={styles.navItem}>Reminders</div>
          <div style={styles.navItem}>Alerts</div>
          <div style={styles.navItem}>Patients</div>
        </nav>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <h1 style={styles.welcome}>Welcome, {user.role}</h1>
          <div style={styles.badge}>Patient: Rina Devi</div>
        </header>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <PatientOverview />
          <WeeklyGameTypeChart />
          <MonthlyAnalyticsChart />
        </div>
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
  },
  sidebarBrand: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 32,
    color: "var(--color-ochre)",
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
  grid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 20,
  },
  card: {
    background: "#fff",
    borderRadius: 14,
    padding: 20,
    boxShadow: "0 4px 16px rgba(74,50,38,0.08)",
  },
  statCard: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderTop: "6px solid var(--color-ochre)",
  },
  statLabel: { color: "var(--color-brown)", fontSize: 14 },
  statValue: { color: "var(--color-terracotta)", fontSize: 40, fontWeight: 700 },
  statTrend: { color: "var(--color-sage)", fontSize: 14, fontWeight: 600 },
};