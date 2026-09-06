import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const dummySessions = [
  { timestamp: "2026-08-24", game_type: "memory" },
  { timestamp: "2026-08-24", game_type: "attention" },
  { timestamp: "2026-08-24", game_type: "recall" },

  { timestamp: "2026-08-25", game_type: "memory" },
  { timestamp: "2026-08-25", game_type: "pattern" },

  { timestamp: "2026-08-26", game_type: "memory" },
  { timestamp: "2026-08-26", game_type: "attention" },
  { timestamp: "2026-08-26", game_type: "recall" },
  { timestamp: "2026-08-26", game_type: "pattern" },

  { timestamp: "2026-08-27", game_type: "memory" },
  { timestamp: "2026-08-27", game_type: "recall" },
];

function countByDate(sessions) {
  const counts = {};
  sessions.forEach((s) => {
    counts[s.timestamp] = (counts[s.timestamp] || 0) + 1;
  });
  return Object.entries(counts).map(([date, count]) => ({ date, count }));
}

export default function EngagementChart({ sessions = dummySessions }) {
  const data = countByDate(sessions);
  const avgSessions = data.length
    ? (data.reduce((sum, d) => sum + d.count, 0) / data.length).toFixed(1)
    : "0.0";

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 4px 16px rgba(74,50,38,0.08)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 style={{ color: "var(--color-brown)", fontSize: "var(--font-size-lg)", margin: 0 }}>
          Engagement — Sessions per Day
        </h2>
        <span style={{ color: "var(--color-sage)", fontSize: 14, fontWeight: 600 }}>
          Avg: {avgSessions} sessions/day
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 16, right: 24, bottom: 12, left: 8 }}>
          <CartesianGrid stroke="var(--color-sage)" strokeOpacity={0.2} vertical={false} />
          <XAxis dataKey="date" stroke="var(--color-charcoal)" tickMargin={12} />
          <YAxis stroke="var(--color-charcoal)" allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" name="Sessions" fill="var(--color-sage)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}