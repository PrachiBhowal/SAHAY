import React, { useEffect } from 'react';
import { useGameTwoLogic } from './useGameTwoLogic';
import { useSundown } from '../../sundown/SundownContext';
import { getTrackById } from '../../music/musicLibrary';
import { useAmbientAudio } from '../../music/useAmbientAudio';
import { unlockAudio } from '../../music/ambientSynth';
import './GameTwo.css';

/**
 * GameTwo — "Spot what changed" (Attention & Concentration).
 *
 * Day 4 additions:
 *   - Optional soft background music (musicTrackId prop), volume
 *     automatically lowered ~40% during sundown mode via useSundown().
 *     Plays a real file once musicLibrary.js entries have one, and
 *     falls back to a live-synthesized ambient pad otherwise — see
 *     music/useAmbientAudio.js and music/ambientSynth.js.
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
export function GameTwo({ patientId = null, musicTrackId = null, onRoundComplete, onComfortReady }) {
  const { tiles, foundIndex, feedback, tapTile, nextRound, difficultyTier } = useGameTwoLogic({
    patientId,
    onComfortReady,
  });
  const { audioVolumeMultiplier } = useSundown();

  const track = musicTrackId ? getTrackById(musicTrackId) : null;
  useAmbientAudio(track, audioVolumeMultiplier, true);

  useEffect(() => {
    if (foundIndex === null) return undefined;
    if (onRoundComplete) onRoundComplete({ difficultyTier });
    const t = setTimeout(nextRound, 2200);
    return () => clearTimeout(t);
  }, [foundIndex, nextRound, onRoundComplete, difficultyTier]);

  const gridColumns = tiles.length <= 4 ? 2 : 3;

  // The synth needs a user gesture to start audio (browser autoplay
  // policy) — the first tile tap satisfies this naturally, so we
  // piggyback the unlock onto the existing tap handler rather than
  // asking the patient to press a separate "enable sound" button.
  const handleTap = (index) => {
    unlockAudio();
    tapTile(index);
  };

  return (
    <div className="game2">
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
            aria-label={tile.label}
            onClick={() => handleTap(i)}
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
