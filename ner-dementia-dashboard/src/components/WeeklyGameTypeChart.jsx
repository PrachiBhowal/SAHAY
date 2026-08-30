import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const dummySessions = [
  { timestamp: "2026-08-24", game_type: "memory", accuracy: 0.62 },
  { timestamp: "2026-08-24", game_type: "attention", accuracy: 0.55 },
  { timestamp: "2026-08-24", game_type: "recall", accuracy: 0.70 },
  { timestamp: "2026-08-24", game_type: "pattern", accuracy: 0.48 },

  { timestamp: "2026-08-25", game_type: "memory", accuracy: 0.68 },
  { timestamp: "2026-08-25", game_type: "attention", accuracy: 0.58 },
  { timestamp: "2026-08-25", game_type: "recall", accuracy: 0.72 },
  { timestamp: "2026-08-25", game_type: "pattern", accuracy: 0.53 },

  { timestamp: "2026-08-26", game_type: "memory", accuracy: 0.71 },
  { timestamp: "2026-08-26", game_type: "attention", accuracy: 0.60 },
  { timestamp: "2026-08-26", game_type: "recall", accuracy: 0.74 },
  { timestamp: "2026-08-26", game_type: "pattern", accuracy: 0.57 },

  { timestamp: "2026-08-27", game_type: "memory", accuracy: 0.75 },
  { timestamp: "2026-08-27", game_type: "attention", accuracy: 0.64 },
  { timestamp: "2026-08-27", game_type: "recall", accuracy: 0.77 },
  { timestamp: "2026-08-27", game_type: "pattern", accuracy: 0.60 },
];

const gameColors = {
  memory: "var(--color-terracotta)",
  attention: "var(--color-sage)",
  recall: "var(--color-ochre)",
  pattern: "var(--color-brown)",
};

const gameLabels = {
  memory: "Memory",
  attention: "Attention",
  recall: "Recall",
  pattern: "Pattern",
};


function pivotByDate(sessions) {
  const byDate = {};
  sessions.forEach((s) => {
    if (!byDate[s.timestamp]) byDate[s.timestamp] = { date: s.timestamp };
    byDate[s.timestamp][s.game_type] = Math.round(s.accuracy * 100);
  });
  return Object.values(byDate);
}

export default function WeeklyGameTypeChart({ sessions = dummySessions }) {
  const data = pivotByDate(sessions);

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 4px 16px rgba(74,50,38,0.08)" }}>
      <h2 style={{ color: "var(--color-brown)", fontSize: "var(--font-size-lg)", marginTop: 0 }}>
        Weekly Accuracy by Game
      </h2>
      <ResponsiveContainer width="100%" height={370}>
        <LineChart data={data} margin={{ top: 8, right: 24, bottom: 12, left: 8 }}>
          <CartesianGrid stroke="var(--color-sage)" strokeOpacity={0.2} />
          <XAxis dataKey="date" stroke="var(--color-charcoal)" tickMargin={12} />
          <YAxis stroke="var(--color-charcoal)" unit="%" />
          <Tooltip />
          <Legend wrapperStyle={{ paddingTop: 20 }} />
          {Object.keys(gameColors).map((gameType) => (
            <Line
              key={gameType}
              type="monotone"
              dataKey={gameType}
              name={gameLabels[gameType]}
              stroke={gameColors[gameType]}
              strokeWidth={2.5}
              dot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}