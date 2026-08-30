import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// Shape matches CONTRACTS.md GameSession exactly — swap for api.getSessions() later
const dummySessions = [
  { id: "1", patient_id: "p1", game_type: "memory", timestamp: "2026-08-24", accuracy: 0.62, response_time_ms: 3400, hints_used: 2, difficulty_tier: 2 },
  { id: "2", patient_id: "p1", game_type: "memory", timestamp: "2026-08-25", accuracy: 0.68, response_time_ms: 3100, hints_used: 1, difficulty_tier: 2 },
  { id: "3", patient_id: "p1", game_type: "memory", timestamp: "2026-08-26", accuracy: 0.71, response_time_ms: 2900, hints_used: 1, difficulty_tier: 3 },
  { id: "4", patient_id: "p1", game_type: "memory", timestamp: "2026-08-27", accuracy: 0.75, response_time_ms: 2700, hints_used: 0, difficulty_tier: 3 },
];

export default function WeeklyAccuracyChart({ sessions = dummySessions }) {
  const data = sessions.map((s) => ({
    date: s.timestamp,
    accuracy: Math.round(s.accuracy * 100),
  }));

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 16 }}>
      <h2 style={{ color: "var(--color-brown)", fontSize: "var(--font-size-lg)" }}>
        Weekly Accuracy
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 8, right: 24, bottom: 20, left: 8 }}>
          <CartesianGrid stroke="var(--color-sage)" strokeOpacity={0.3} />
          <XAxis dataKey="date" stroke="var(--color-charcoal)" tickMargin={25} />
          <YAxis stroke="var(--color-charcoal)" unit="%" />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="accuracy"
            stroke="var(--color-terracotta)"
            strokeWidth={3}
            dot={{ fill: "var(--color-ochre)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}