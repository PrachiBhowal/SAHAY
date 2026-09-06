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
  const [assets, setAssets] = useState([]);
  const [usingDummy, setUsingDummy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [familyMemberName, setFamilyMemberName] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchAssets() {
      try {
        const data = await api.getMemoryAssets(patientId);
        if (!cancelled) setAssets(Array.isArray(data) ? data : []);
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

  async function handlePhotoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const name = familyMemberName.trim();
    if (!name) {
      window.alert("Enter the family member's name before choosing a photo.");
      event.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const url = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const asset = await api.createMemoryAsset(patientId, {
        type: "photo",
        url,
        tags: [name],
        uploaded_by: "caregiver",
      });
      setAssets((current) => [asset, ...current]);
      setFamilyMemberName("");
    } catch (err) {
      window.alert(err.message || "Photo upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleDelete(assetId) {
    if (!window.confirm("Remove this memory?")) return;
    try {
      await api.deleteMemoryAsset(patientId, assetId);
      setAssets((current) => current.filter((asset) => asset.id !== assetId));
    } catch (err) {
      window.alert(err.message || "Memory could not be removed.");
    }
  }

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
      <label style={styles.uploadButton}>
        {uploading ? "Uploading..." : "Upload family photo"}
        <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading || !familyMemberName.trim()} hidden />
      </label>
      <label style={styles.nameField}>
        <span>Family member name</span>
        <input
          type="text"
          value={familyMemberName}
          onChange={(event) => setFamilyMemberName(event.target.value)}
          placeholder="e.g. Grandma Aita"
          disabled={uploading}
          style={styles.nameInput}
        />
      </label>
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
            {asset.type === "photo" ? <img src={asset.url} alt="" style={styles.thumbnail} /> : <div style={styles.iconCircle}>{typeIcon[asset.type] || "📄"}</div>}
            <div style={styles.cardType}>{typeLabel[asset.type] || asset.type}</div>
            <div style={styles.cardDate}>{formatDate(asset.created_at)}</div>
            <div style={styles.tagRow}>
              {(asset.tags || []).map((tag) => (
                <span key={tag} style={styles.tagChip}>{tag.replace("-", " ")}</span>
              ))}
            </div>
            <button type="button" onClick={() => handleDelete(asset.id)} style={styles.deleteButton}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  uploadButton: {
    display: "inline-block", background: "var(--color-terracotta)", color: "#fff", padding: "9px 14px",
    borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 14, margin: "8px 0 16px",
  },
  nameField: {
    display: "flex", flexDirection: "column", gap: 5, color: "var(--color-brown)",
    fontSize: 13, fontWeight: 700, marginBottom: 12, maxWidth: 320,
  },
  nameInput: {
    border: "1px solid var(--color-sage)", borderRadius: 6, padding: "8px 10px", fontSize: 14,
  },
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
  thumbnail: { width: "100%", height: 110, objectFit: "cover", borderRadius: 8, background: "#fff" },
  deleteButton: { border: "none", background: "transparent", color: "var(--color-terracotta)", cursor: "pointer", padding: 0, textAlign: "left" },
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