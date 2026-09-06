import { lazy, Suspense, useState, useEffect } from "react";
import "./styles/tokens.css";
import Login from "./pages/Login";
import { api, clearToken } from "./api/client";
import PatientOverview from "./components/PatientOverview";
import RemindersPanel from "./components/RemindersPanel";
import PatientsList from "./components/PatientsList";
import AlertsPanel from "./components/AlertsPanel";
import "./styles/dashboard.css";

const WeeklyGameTypeChart = lazy(() => import("./components/WeeklyGameTypeChart"));
const MonthlyAnalyticsChart = lazy(() => import("./components/MonthlyAnalyticsChart"));
const EngagementChart = lazy(() => import("./components/EngagementChart"));

function difficultyTiersFromSessions(currentTiers, sessions) {
  const latestByGame = new Map();
  sessions.forEach((session) => {
    if (!session.game_type || !Number.isInteger(session.difficulty_tier)) return;
    const previous = latestByGame.get(session.game_type);
    if (!previous || new Date(session.timestamp) > new Date(previous.timestamp)) {
      latestByGame.set(session.game_type, session);
    }
  });

  return Object.fromEntries(
    Object.entries(currentTiers).map(([gameType, currentTier]) => [
      gameType,
      latestByGame.get(gameType)?.difficulty_tier ?? currentTier,
    ])
  );
}

function sameDifficultyTiers(left, right) {
  return Object.keys(left).every((gameType) => left[gameType] === right[gameType]);
}

const PATIENT_APP_URL = import.meta.env.VITE_PATIENT_APP_URL || "http://localhost:5173";

function LinkPatientCard({ user, onLinked, onLogout }) {
  const [patientId, setPatientId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const normalizedId = patientId.trim();
    if (!normalizedId) return;
    setSaving(true);
    setError("");
    try {
      await api.linkPatient(normalizedId);
      const patient = await api.getPatient(normalizedId);
      onLinked(patient);
    } catch (linkError) {
      setError(linkError.message || "We could not add that patient.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="dashboard-empty-screen">
      <section className="dashboard-empty-panel">
        <div className="dashboard-brand-mark">S</div>
        <p className="dashboard-eyebrow">SAHAY caregiver space</p>
        <h1 className="dashboard-welcome">Welcome, {user.name || "caregiver"}</h1>
        <p className="dashboard-empty-copy">Add a patient to begin following their activities and reminders.</p>
        <div className="dashboard-account-code">
          <span>Your caregiver code</span>
          <strong>{user.caregiver_code || "Loading..."}</strong>
          <small>Share this code with a patient so they can connect their account to yours.</small>
        </div>
        <form className="dashboard-link-form" onSubmit={handleSubmit}>
          <label htmlFor="new-patient-id">Patient ID</label>
          <input
            id="new-patient-id"
            value={patientId}
            onChange={(event) => setPatientId(event.target.value)}
            placeholder="patient-..."
            autoComplete="off"
          />
          {error && <p className="dashboard-error" role="alert">{error}</p>}
          <button type="submit" className="dashboard-launch-button" disabled={saving || !patientId.trim()}>
            {saving ? "Adding patient..." : "Add patient"}
          </button>
        </form>
        <button type="button" className="dashboard-empty-signout" onClick={onLogout}>Sign out</button>
      </section>
    </main>
  );
}

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
    const patient = activePatient;
    const patientId = patient.id;
    let cancelled = false;
    setSessionsLoading(true);
    setSessionsError(null);

    Promise.all([
      api.getSessions(patientId, "week"),
      api.getSessions(patientId, "month"),
      api.getReminders(patientId),
    ])
      .then(async ([week, month, remindersData]) => {
        if (cancelled) return;

        const updatedDifficultyTiers = difficultyTiersFromSessions(
          patient.difficulty_tiers,
          month
        );
        let patientForDashboard = patient;
        if (!sameDifficultyTiers(patient.difficulty_tiers, updatedDifficultyTiers)) {
          // PATCH /patients/:id body: { difficulty_tiers: { memory, attention, recall, pattern } }
          patientForDashboard = await api.updatePatient(patientId, updatedDifficultyTiers);
          if (cancelled) return;
          setPatients((currentPatients) =>
            currentPatients.map((patient) =>
              patient.id === patientId ? patientForDashboard : patient
            )
          );
          setActivePatient(patientForDashboard);
        }
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
  if (!activePatient) {
    return (
      <LinkPatientCard
        user={user}
        onLinked={(patient) => {
          setPatients([patient]);
          setActivePatient(patient);
        }}
        onLogout={handleLogout}
      />
    );
  }

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
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand-mark">S</div>
        <div className="dashboard-brand">SAHAY</div>
        <div className="dashboard-sidebar-tagline">Caregiver companion</div>

        <nav className="dashboard-nav" aria-label="Dashboard sections">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`dashboard-nav-item ${activeTab === item.id ? "is-active" : ""}`}
            >
              <span className="dashboard-nav-icon" aria-hidden="true">{item.id === "overview" ? "⌂" : item.id === "reminders" ? "◷" : item.id === "alerts" ? "!" : "●"}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="dashboard-sidebar-footer">
          <a
            href={`${PATIENT_APP_URL}/?patientId=${activePatient.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="dashboard-patient-link"
          >
            Open Patient App <span aria-hidden="true">↗</span>
          </a>
          <button type="button" onClick={handleLogout} className="dashboard-logout-button">
            Sign out
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">{isAsha ? "ASHA health worker" : "Family caregiver"}</p>
            <h1 className="dashboard-welcome">Welcome, {user.name || user.role}</h1>
            <p className="dashboard-subtitle">
              {isAsha ? "ASHA Health Worker Portal" : "Family Caregiver Portal"}
            </p>
          </div>
          <div className="dashboard-header-actions">
            <div className="dashboard-account-code"><span>Caregiver code</span><strong>{user.caregiver_code}</strong></div>
            <div className="dashboard-patient-badge"><span>Viewing</span>{activePatient.name}</div>
            <a
              href={`${PATIENT_APP_URL}/?patientId=${activePatient.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="dashboard-launch-button"
              title={`Launch SAHAY Patient App for ${activePatient.name}`}
            >
              Open Patient Mode <span aria-hidden="true">↗</span>
            </a>
          </div>
        </header>


        {sessionsError && (
          <p className="dashboard-error" role="alert">
            Could not load session data: {sessionsError}
          </p>
        )}

        {activeTab === "overview" && (
          <div className="dashboard-content-stack">
            <PatientOverview patient={activePatient} lastActive={lastActive} />
            {sessionsLoading ? (
              <p className="dashboard-status">Loading charts...</p>
            ) : (
              <Suspense fallback={<p className="dashboard-status">Preparing charts...</p>}>
                <WeeklyGameTypeChart sessions={weeklySessions} />
                <MonthlyAnalyticsChart sessions={monthlySessions} />
                <EngagementChart sessions={weeklySessions} />
              </Suspense>
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
      <nav className="dashboard-bottom-nav" aria-label="Dashboard sections">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`dashboard-bottom-nav-item ${activeTab === item.id ? "is-active" : ""}`}
          >
            <span className="dashboard-nav-icon" aria-hidden="true">{item.id === "overview" ? "⌂" : item.id === "reminders" ? "◷" : item.id === "alerts" ? "!" : "●"}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
