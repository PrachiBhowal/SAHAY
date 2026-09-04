import React, { useState } from 'react';
import { MUSIC_LIBRARY } from './musicLibrary';
import { Button } from '../components/Button';

/**
 * MusicLinkPicker — caregiver-facing UI: "link a favorite song".
 *
 * Produces a MemoryAsset in the exact CONTRACTS.md shape (type: "music")
 * so it flows through the same pipeline as photos/voice recordings.
 * Caregiver either picks from the curated library or (later, once
 * Person 5's upload endpoint exists) uploads their own recording of a
 * song the patient loves — the shape is the same either way.
 *
 * Props:
 *   patientId, caregiverId — required to build a valid MemoryAsset
 *   onLink(memoryAsset) — called with the created record; caller
 *     decides whether to POST it (Person 5's /memory-assets endpoint)
 *     or queue it locally (Person 1's storage layer) until online
 */
export function MusicLinkPicker({ patientId, caregiverId, onLink }) {
  const [selectedId, setSelectedId] = useState(null);
  const [tag, setTag] = useState('');

  const handleLink = () => {
    if (!selectedId) return;
    const track = MUSIC_LIBRARY.find((t) => t.id === selectedId);
    if (!track) return;

    const memoryAsset = {
      id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      patient_id: patientId,
      type: 'music',
      url: track.url || `pending://${track.id}`, // swap once real audio files exist
      tags: [track.id, ...(tag ? [tag] : [])],
      uploaded_by: caregiverId,
      created_at: new Date().toISOString(),
    };

    onLink(memoryAsset);
  };

  return (
    <div className="music-link-picker">
      <p className="music-link-picker__prompt">Choose a song this patient loves</p>

      <div className="music-link-picker__list" role="radiogroup" aria-label="Choose a song">
        {MUSIC_LIBRARY.map((track) => (
          <label key={track.id} className="music-link-picker__option">
            <input
              type="radio"
              name="music-track"
              value={track.id}
              checked={selectedId === track.id}
              onChange={() => setSelectedId(track.id)}
            />
            <span className="music-link-picker__option-text">
              <strong>{track.title}</strong>
              <span className="music-link-picker__option-mood">{track.mood}</span>
            </span>
          </label>
        ))}
      </div>

      <label className="music-link-picker__tag-label">
        What's it linked to? (optional — e.g. "wedding song", "morning tea")
        <input
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="music-link-picker__tag-input"
        />
      </label>

      <Button onClick={handleLink} disabled={!selectedId}>
        Save this song
      </Button>
    </div>
  );
}
