import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot,
} from "recharts";

function aggregateByWeek(sessions) {
  if (sessions.length === 0) return [];
  const sorted = sessions
    .filter((session) => typeof session.accuracy === "number")
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const start = new Date(sorted[0].timestamp);

  const buckets = {};
  sorted.forEach((s) => {
    const days = Math.floor((new Date(s.timestamp) - start) / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(days / 7) + 1;
    const label = `Week ${weekIndex}`;
    if (!buckets[label]) buckets[label] = { total: 0, count: 0 };
    buckets[label].total += s.accuracy * 100;
    buckets[label].count += 1;
  });

  return Object.entries(buckets)
    .sort((a, b) => parseInt(a[0].replace("Week ", "")) - parseInt(b[0].replace("Week ", "")))
    .map(([week, { total, count }]) => ({ week, avgAccuracy: Math.round(total / count) }));
}

function detectAnomalies(data, threshold = 15) {
  const mean = data.reduce((sum, d) => sum + d.avgAccuracy, 0) / data.length;
  return data.map((d) => ({
    ...d,
    isAnomaly: Math.abs(d.avgAccuracy - mean) > threshold,
  }));
}

function AnomalyDot(props) {
  const { cx, cy, payload } = props;
  if (payload.isAnomaly) {
    return <Dot cx={cx} cy={cy} r={8} fill="#fff" stroke="var(--color-terracotta)" strokeWidth={3} />;
  }
  return <Dot cx={cx} cy={cy} r={4} fill="var(--color-ochre)" />;
}

export default function MonthlyAnalyticsChart({ sessions = [] }) {
  const weekly = aggregateByWeek(sessions);
  const enriched = detectAnomalies(weekly);
  const anomalies = enriched.filter((d) => d.isAnomaly);

  if (weekly.length === 0) {
    return (
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 4px 16px rgba(74,50,38,0.08)" }}>
        <h2 style={{ color: "var(--color-brown)", fontSize: "var(--font-size-lg)", marginTop: 0 }}>
          Monthly Trend
        </h2>
        <p style={{ color: "var(--color-sage)" }}>Not enough session data yet.</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 4px 16px rgba(74,50,38,0.08)" }}>
      <h2 style={{ color: "var(--color-brown)", fontSize: "var(--font-size-lg)", marginTop: 0 }}>
        Monthly Trend
      </h2>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={enriched} margin={{ top: 8, right: 24, bottom: 20, left: 8 }}>
          <CartesianGrid stroke="var(--color-sage)" strokeOpacity={0.2} />
          <XAxis dataKey="week" stroke="var(--color-charcoal)" tickMargin={12} />
          <YAxis stroke="var(--color-charcoal)" unit="%" />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="avgAccuracy"
            stroke="var(--color-ochre)"
            strokeWidth={2.5}
            dot={<AnomalyDot />}
          />
        </LineChart>
      </ResponsiveContainer>

      {anomalies.length > 0 && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--color-background)", borderRadius: 8, borderLeft: "4px solid var(--color-terracotta)" }}>
          <span style={{ color: "var(--color-brown)", fontSize: 14, fontWeight: 600 }}>
            ⚠ Flagged: {anomalies.map((a) => a.week).join(", ")} — accuracy dropped notably below trend. Worth a check-in.
          </span>
        </div>
      )}
    </div>
  );
}