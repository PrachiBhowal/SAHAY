import { useEffect, useRef } from 'react';
import { startAmbientPreset, unlockAudio } from './ambientSynth';

/**
 * useAmbientAudio — plays background music for a track from
 * musicLibrary.js. Prefers a real audio file (`track.url`) once one
 * exists; falls back to the live synth preset (matched by track id)
 * when `url` is still null, which is the case for every track today.
 *
 * Swapping in real recordings later needs zero changes here — just
 * fill in `url` on the relevant entry in musicLibrary.js and this hook
 * automatically switches from synth to file playback.
 *
 * @param track - an entry from MUSIC_LIBRARY, or null for silence
 * @param volumeMultiplier - e.g. sundown's audioVolumeMultiplier
 * @param enabled - pass false to force silence regardless of track
 */
export function useAmbientAudio(track, volumeMultiplier = 1, enabled = true) {
  const audioElRef = useRef(null);
  const synthHandleRef = useRef(null);

  useEffect(() => {
    // Clean up whatever was playing before, every time track/enabled changes
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current = null;
    }
    if (synthHandleRef.current) {
      synthHandleRef.current.stop();
      synthHandleRef.current = null;
    }

    if (!track || !enabled) return undefined;

    if (track.url) {
      const audio = new Audio(track.url);
      audio.loop = true;
      audio.volume = 0.35 * volumeMultiplier;
      audio.play().catch(() => {
        // Autoplay can still be blocked without a user gesture having
        // happened yet — non-fatal, just means no sound this round.
      });
      audioElRef.current = audio;
    } else {
      unlockAudio();
      synthHandleRef.current = startAmbientPreset(track.id);
      synthHandleRef.current?.setVolume(volumeMultiplier);
    }

    return () => {
      audioElRef.current?.pause();
      synthHandleRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id, enabled]);

  // Volume changes (e.g. entering/exiting sundown) shouldn't restart
  // playback — just ramp the existing sound's volume.
  useEffect(() => {
    if (audioElRef.current) {
      audioElRef.current.volume = 0.35 * volumeMultiplier;
    }
    if (synthHandleRef.current) {
      synthHandleRef.current.setVolume(volumeMultiplier);
    }
  }, [volumeMultiplier]);
}
