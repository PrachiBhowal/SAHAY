/**
 * Object bank for "Spot what changed".
 *
 * PLACEHOLDER CONTENT: emoji stand-ins so the game is playable and
 * testable today. Person 6 owns cultural content curation (per
 * AI_HANDOFF Section 5) — swap `icon` for real illustrated NER-appropriate
 * assets once available. Keep the shape (id, icon, label, similar,
 * distant) the same so nothing else has to change.
 *
 * Deliberately everyday/familiar objects (tea, lamp, basket, grain) —
 * per Section 9 of AI_HANDOFF: culturally familiar but understated,
 * not caricatured.
 *
 * DESIGN NOTE (changed from the original color-swap version): the
 * "changed" tile now swaps in a *different object* rather than a
 * recolored version of the same one. A same-color-different-shade
 * signal isn't reliably visible to colorblind patients or under the
 * dimmed sundown palette — a different object is unambiguous
 * regardless of color vision. All tiles share one uniform background
 * fill (see GameTwo.jsx), so color carries no information at all.
 */
export const OBJECT_BANK = [
  {
    id: 'tea-cup',
    icon: '🍵',
    label: 'tea cup',
    similar: { icon: '☕', label: 'coffee cup' }, // same category, subtle shape difference — hard tiers
    distant: { icon: '🌸', label: 'flower' }, // unrelated, obvious — easy tiers
  },
  {
    id: 'oil-lamp',
    icon: '🪔',
    label: 'oil lamp',
    similar: { icon: '🕯️', label: 'candle' },
    distant: { icon: '🧺', label: 'basket' },
  },
  {
    id: 'basket',
    icon: '🧺',
    label: 'basket',
    similar: { icon: '🎁', label: 'gift box' },
    distant: { icon: '🍵', label: 'tea cup' },
  },
  {
    id: 'flower',
    icon: '🌸',
    label: 'flower',
    similar: { icon: '🌼', label: 'daisy' },
    distant: { icon: '🪔', label: 'oil lamp' },
  },
  {
    id: 'grain',
    icon: '🌾',
    label: 'grain',
    similar: { icon: '🌿', label: 'herb sprig' },
    distant: { icon: '🎁', label: 'gift box' },
  },
];

/**
 * Difficulty → board shape. Person 4's difficulty engine will eventually
 * drive `tier` here; for now this table is the whole difficulty model.
 *
 *  - gridSize: how many tiles on screen (more = harder to scan)
 *  - distractorType: 'distant' (easy, obviously different object) or
 *    'similar' (hard, same-category object — closer visual read)
 *  - hintDelayMs: how long before a gentle hint nudge appears unprompted
 */
export const DIFFICULTY_CONFIG = {
  1: { gridSize: 4, distractorType: 'distant', hintDelayMs: 20000 },
  2: { gridSize: 6, distractorType: 'distant', hintDelayMs: 15000 },
  3: { gridSize: 6, distractorType: 'similar', hintDelayMs: 10000 },
  4: { gridSize: 9, distractorType: 'similar', hintDelayMs: 8000 },
  5: { gridSize: 9, distractorType: 'similar', hintDelayMs: 6000 },
};
