import { useState, useEffect } from "react";
import { api } from "../api/client";

const dummyAssets = [
  {
    id: "m1",
    patient_id: "p1",
    type: "voice",
    url: "#",
    tags: ["still-useful", "family"],
    uploaded_by: "caregiver-1",
    created_at: "2026-08-27T18:00:00Z",
  },
  {
    id: "m2",
    patient_id: "p1",
    type: "photo",
    url: "#",
    tags: ["grandchildren", "family"],
    uploaded_by: "caregiver-1",
    created_at: "2026-08-25T10:00:00Z",
  },
  {
    id: "m3",
    patient_id: "p1",
    type: "music",
    url: "#",
    tags: ["favorite-song"],
    uploaded_by: "caregiver-1",
    created_at: "2026-08-20T09:00:00Z",
  },
  {
    id: "m4",
    patient_id: "p1",
    type: "voice",
    url: "#",
    tags: ["still-useful"],
    uploaded_by: "caregiver-1",
    created_at: "2026-08-18T14:00:00Z",
  },
];

const typeIcon = { photo: "📷", voice: "🎙️", music: "🎵" };
const typeLabel = { photo: "Photo", voice: "Voice Recording", music: "Song" };

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function MemoryShelf({ patientId = "p1", patientName = "Rina Devi" }) {
  const [assets, setAssets] = useState(dummyAssets);
  const [usingDummy, setUsingDummy] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAssets() {
      try {
        const data = await api.getMemoryAssets(patientId);
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setAssets(data);
          setUsingDummy(false);
        }
        // If API returns empty array or unexpected shape, silently keep dummy data
      } catch (err) {
        // API not ready / errored — keep dummy data, no visible crash
        console.warn("Falling back to dummy memory assets:", err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAssets();
    return () => { cancelled = true; };
  }, [patientId]);

  const stillUsefulCount = assets.filter((a) => a.tags?.includes("still-useful")).length;

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 4px 16px rgba(74,50,38,0.08)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h2 style={{ color: "var(--color-brown)", fontSize: "var(--font-size-lg)", margin: 0 }}>
          Memory Shelf
        </h2>
        <span style={{ color: "var(--color-sage)", fontSize: 14, fontWeight: 600 }}>
          {stillUsefulCount} "Still Useful" recordings
        </span>
      </div>
      <p style={{ color: "var(--color-sage)", fontSize: 14, marginTop: 0, marginBottom: 12 }}>
        Photos, voices, and songs that matter to {patientName} — recorded from her daily "Still Useful" moments and family uploads.
      </p>

      {usingDummy && !loading && (
        <div style={styles.devNotice}>
          Showing placeholder data — live memory assets not yet reachable.
        </div>
      )}

      <div style={styles.grid}>
        {assets.map((asset) => (
          <div key={asset.id} style={styles.card}>
            <div style={styles.iconCircle}>{typeIcon[asset.type] || "📄"}</div>
            <div style={styles.cardType}>{typeLabel[asset.type] || asset.type}</div>
            <div style={styles.cardDate}>{formatDate(asset.created_at)}</div>
            <div style={styles.tagRow}>
              {(asset.tags || []).map((tag) => (
                <span key={tag} style={styles.tagChip}>{tag.replace("-", " ")}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  devNotice: {
    background: "var(--color-background)",
    color: "var(--color-brown)",
    fontSize: 13,
    padding: "8px 12px",
    borderRadius: 8,
    marginBottom: 16,
    borderLeft: "3px solid var(--color-ochre)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 14,
  },
  card: {
    background: "var(--color-background)",
    borderRadius: 12,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    marginBottom: 4,
  },
  cardType: { color: "var(--color-brown)", fontWeight: 700, fontSize: 15 },
  cardDate: { color: "var(--color-sage)", fontSize: 13 },
  tagRow: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 },
  tagChip: {
    background: "#fff",
    color: "var(--color-terracotta)",
    fontSize: 11,
    fontWeight: 600,
    padding: "3px 8px",
    borderRadius: 10,
    textTransform: "capitalize",
  },
};