import React, { useEffect, useRef } from 'react';
import { useGameTwoLogic } from './useGameTwoLogic';
import { useSundown } from '../../sundown/SundownContext';
import { getTrackById } from '../../music/musicLibrary';
import './GameTwo.css';

/**
 * GameTwo — "Spot what changed" (Attention & Concentration).
 *
 * Day 4 additions:
 *   - Optional soft background music (musicTrackId prop), volume
 *     automatically lowered ~40% during sundown mode via useSundown().
 *   - Difficulty tier now comes from the difficulty engine (stub or
 *     real), shown subtly for dev/demo visibility that it's adapting.
 *
 * Props:
 *   patientId — current patient's id, if known by the app shell.
 *   musicTrackId — id from musicLibrary.js to play softly in the
 *     background, or null/omitted for silence. Caregiver sets this via
 *     MusicLinkPicker; the app shell passes it down once loaded.
 *   onRoundComplete — optional callback(session) after each solve.
 */
export function GameTwo({ patientId = null, musicTrackId = null, onRoundComplete }) {
  const { tiles, foundIndex, feedback, tapTile, nextRound, difficultyTier } = useGameTwoLogic({
    patientId,
  });
  const { audioVolumeMultiplier } = useSundown();
  const audioRef = useRef(null);

  const track = musicTrackId ? getTrackById(musicTrackId) : null;

  // Keep volume in sync with sundown mode without restarting playback
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.35 * audioVolumeMultiplier; // base level kept soft either way
    }
  }, [audioVolumeMultiplier]);

  useEffect(() => {
    if (foundIndex === null) return undefined;
    if (onRoundComplete) onRoundComplete({ difficultyTier });
    const t = setTimeout(nextRound, 2200);
    return () => clearTimeout(t);
  }, [foundIndex, nextRound, onRoundComplete, difficultyTier]);

  const gridColumns = tiles.length <= 4 ? 2 : 3;

  return (
    <div className="game2">
      {track && track.url && (
        <audio ref={audioRef} src={track.url} loop autoPlay aria-hidden="true" />
      )}

      <div className="game2__header">
        <span className="game2__eyebrow">Spot what changed</span>
        {/* Dev/demo visibility only — remove or hide behind a debug
            flag before the polished Day 6 build if it's too "techy"
            looking for the patient-facing screen. */}
        <span className="game2__tier-badge" aria-hidden="true">
          Tier {difficultyTier}
        </span>
      </div>

      <p className="game2__prompt">One thing looks different. Can you find it?</p>

      <div
        className="game2__grid"
        style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}
        role="group"
        aria-label="Tap the object that looks different"
      >
        {tiles.map((tile, i) => (
          <button
            key={i}
            type="button"
            className={`game2__tile ${foundIndex === i ? 'is-found' : ''}`}
            style={{ backgroundColor: tile.color }}
            aria-label={tile.label}
            onClick={() => tapTile(i)}
            disabled={foundIndex !== null}
          >
            <span aria-hidden="true">{tile.icon}</span>
          </button>
        ))}
      </div>

      {feedback && (
        <div className={`game2__feedback game2__feedback--${feedback.tone}`}>
          {feedback.message}
        </div>
      )}
    </div>
  );
}
