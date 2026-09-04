/**
 * Music library — Person 2's shared module (music-memory feature).
 *
 * IMPORTANT: this file defines the CURATION (mood, style, metadata,
 * suggested legal sources) — it does not and cannot ship actual audio
 * files from this chat. Someone on the team needs to actually download
 * a track matching each brief below from a genuinely royalty-free
 * source and drop it into /public/audio/ (or wherever your build
 * serves static assets), then fill in the `url` field.
 *
 * WHY NOT JUST GRAB SOMETHING OFF YOUTUBE: even background music in a
 * hackathon demo can create real licensing risk if it's a copyrighted
 * commercial recording, and "royalty-free" claims found via casual
 * search are often wrong. Use sources with clear, explicit licenses:
 *   - Free Music Archive (freemusicarchive.org) — filter by CC license
 *   - Freesound.org — filter by "Creative Commons 0" (no attribution needed)
 *   - YouTube Audio Library (studio.youtube.com, no account needed to browse)
 *   - Pixabay Music (pixabay.com/music) — free license, no attribution required
 * Always double-check the specific license terms on the track's own
 * page before using it, even on these sites — collections aren't
 * uniformly licensed.
 */

export const MUSIC_LIBRARY = [
  {
    id: 'calm-morning',
    title: 'Calm morning',
    mood: 'gentle, waking-up energy',
    styleNotes:
      'Slow acoustic instrumental — soft flute or plucked string lead, minimal percussion. Avoid anything with lyrics or a strong beat.',
    suggestedTempo: '60-80 BPM',
    tags: ['morning', 'calm', 'instrumental'],
    url: null, // fill in once a real track is sourced and placed in /public/audio
    licenseNote: 'PENDING — source from FMA/Freesound/Pixabay, confirm CC/royalty-free terms',
  },
  {
    id: 'quiet-afternoon',
    title: 'Quiet afternoon',
    mood: 'warm, unhurried',
    styleNotes: 'Light bamboo-flute or harmonium-style instrumental, sparse arrangement, no vocals.',
    suggestedTempo: '55-70 BPM',
    tags: ['afternoon', 'calm', 'instrumental'],
    url: null,
    licenseNote: 'PENDING',
  },
  {
    id: 'evening-hearth',
    title: 'Evening hearth',
    mood: 'soothing, low-energy — used in sundown mode',
    styleNotes:
      'Very sparse, drone-like or slow string pad. This is the track most likely to play during sundown mode and comfort de-escalation, so it should be the calmest of the set.',
    suggestedTempo: '<55 BPM or free tempo/ambient',
    tags: ['evening', 'sundown', 'comfort', 'instrumental'],
    url: null,
    licenseNote: 'PENDING',
  },
  {
    id: 'gentle-folk',
    title: 'Gentle folk theme',
    mood: 'familiar, regional warmth',
    styleNotes:
      'A simple folk-style instrumental melody (not a specific copyrighted regional song) — think a plain melodic line on a traditional-sounding instrument, arranged sparsely. Keep it generic/original rather than a recognizable recording of an actual traditional song, since traditional melodies performed by a specific artist are still copyrightable as that recording.',
    suggestedTempo: '65-85 BPM',
    tags: ['folk', 'familiar', 'instrumental'],
    url: null,
    licenseNote: 'PENDING',
  },
];

/** Convenience lookup used by sundown mode / comfort de-escalation */
export function getTrackById(id) {
  return MUSIC_LIBRARY.find((t) => t.id === id) || null;
}

/** Tracks appropriate for sundown / comfort contexts specifically */
export function getCalmingTracks() {
  return MUSIC_LIBRARY.filter((t) => t.tags.includes('sundown') || t.tags.includes('comfort'));
}
