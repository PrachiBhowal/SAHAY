/**
 * ambientSynth.js — generates soft ambient pads live in the browser
 * using the Web Audio API. No audio files, no sourcing, no licensing
 * questions — everything here is synthesized at runtime.
 *
 * This is a real, honest placeholder for the "calming audio" briefs in
 * musicLibrary.js, not a substitute for the real curated recordings —
 * swap in real files later by setting a track's `url` field; the app
 * already prefers a real `url` over the synth when one exists (see
 * useAmbientAudio.js).
 *
 * Each preset is a handful of sustained sine/triangle tones (a simple
 * chord), run through a gentle lowpass filter and a slow LFO that
 * subtly wobbles the filter cutoff so it doesn't sound like a dead,
 * static drone. Everything fades in/out smoothly to avoid clicks/pops.
 */

// One shared AudioContext for the whole app — browsers only allow a
// handful of these, and it must be resumed after a user gesture
// (tapping a game tile counts) due to autoplay policy.
let sharedContext = null;

function getContext() {
  if (!sharedContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    sharedContext = new AudioContextClass();
  }
  return sharedContext;
}

/** Call this from a real user interaction (e.g. first tile tap) to
 * satisfy browser autoplay policy before any sound is expected. */
export function unlockAudio() {
  const ctx = getContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

/**
 * Mood presets. `frequencies` are a simple sustained chord in Hz,
 * `filterHz` is the lowpass cutoff (lower = darker/softer), `lfoRateHz`
 * and `lfoDepthHz` control the slow filter wobble that keeps the pad
 * feeling alive rather than static.
 */
const PRESETS = {
  'calm-morning': {
    frequencies: [130.81, 164.81, 196.0], // C3, E3, G3 — open, bright-ish triad
    waveform: 'sine',
    filterHz: 1400,
    lfoRateHz: 0.06,
    lfoDepthHz: 200,
    gain: 0.14,
  },
  'quiet-afternoon': {
    frequencies: [110.0, 130.81, 164.81], // A2, C3, E3 — softer, slightly darker
    waveform: 'sine',
    filterHz: 1000,
    lfoRateHz: 0.05,
    lfoDepthHz: 140,
    gain: 0.12,
  },
  'evening-hearth': {
    frequencies: [82.41, 123.47], // E2, B2 — sparse open fifth, lowest/quietest
    waveform: 'sine',
    filterHz: 600,
    lfoRateHz: 0.035,
    lfoDepthHz: 80,
    gain: 0.09,
  },
  'gentle-folk': {
    frequencies: [146.83, 174.61, 220.0], // D3, F3, A3
    waveform: 'triangle',
    filterHz: 1200,
    lfoRateHz: 0.08,
    lfoDepthHz: 180,
    gain: 0.12,
  },
};

/**
 * Starts a preset playing. Returns a handle with `setVolume(multiplier)`
 * and `stop()` — hold onto it and call stop() on unmount/track change.
 */
export function startAmbientPreset(presetId) {
  const preset = PRESETS[presetId];
  if (!preset) return null;

  const ctx = getContext();
  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(preset.gain, now + 1.5); // gentle fade-in
  masterGain.connect(ctx.destination);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(preset.filterHz, now);
  filter.connect(masterGain);

  const oscillators = preset.frequencies.map((freq) => {
    const osc = ctx.createOscillator();
    osc.type = preset.waveform;
    osc.frequency.setValueAtTime(freq, now);
    osc.connect(filter);
    osc.start(now);
    return osc;
  });

  // Slow LFO wobbling the filter cutoff so the pad breathes instead of
  // sitting static — subtle on purpose, this should barely be noticed
  // consciously.
  const lfo = ctx.createOscillator();
  lfo.frequency.setValueAtTime(preset.lfoRateHz, now);
  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(preset.lfoDepthHz, now);
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start(now);

  let currentVolumeMultiplier = 1;

  return {
    setVolume(multiplier) {
      currentVolumeMultiplier = multiplier;
      const target = preset.gain * multiplier;
      masterGain.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.6);
    },
    stop() {
      const stopTime = ctx.currentTime + 1.2;
      masterGain.gain.linearRampToValueAtTime(0, stopTime); // fade out, no click
      oscillators.forEach((osc) => osc.stop(stopTime));
      lfo.stop(stopTime);
    },
  };
}

export const AMBIENT_PRESET_IDS = Object.keys(PRESETS);
