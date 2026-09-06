import { useEffect, useState } from "react";
import { api } from "../api/client";

function formatStoryDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function PatientStories({ patientId }) {
  const [stories, setStories] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api.getMemoryAssets(patientId)
      .then((assets) => {
        if (!cancelled) setStories(assets.filter((asset) => asset.type === "voice"));
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message || "Stories could not be loaded.");
      });
    return () => { cancelled = true; };
  }, [patientId]);

  return (
    <section className="patient-stories-card" aria-labelledby="patient-stories-title">
      <div className="patient-stories-heading">
        <div>
          <p className="dashboard-eyebrow">Shared memories</p>
          <h2 id="patient-stories-title">Today's stories</h2>
        </div>
        <span>{stories.length} saved</span>
      </div>
      {error && <p className="dashboard-error" role="alert">{error}</p>}
      {!error && stories.length === 0 && <p className="patient-stories-empty">No recorded stories yet.</p>}
      <div className="patient-stories-list">
        {stories.map((story) => (
          <article className="patient-story-row" key={story.id}>
            <div>
              <strong>{story.tags?.[0] ? `Story from ${story.tags[0]}` : "Patient story"}</strong>
              <small>{formatStoryDate(story.created_at)}</small>
            </div>
            <audio controls preload="metadata" src={story.url} aria-label={`Play story recorded ${formatStoryDate(story.created_at)}`} />
          </article>
        ))}
      </div>
    </section>
  );
}
