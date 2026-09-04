/**
 * Object bank for "Spot what changed".
 *
 * PLACEHOLDER CONTENT: emoji stand-ins so the game is playable and
 * testable today. Person 6 owns cultural content curation (per
 * AI_HANDOFF Section 5) — swap `icon` for real illustrated NER-appropriate
 * assets once available. Keep the shape (id, icon, label, colorVariants)
 * the same so nothing else has to change.
 *
 * Deliberately everyday/familiar objects (tea, lamp, basket, grain) —
 * per Section 9 of AI_HANDOFF: culturally familiar but understated,
 * not caricatured.
 */
export const OBJECT_BANK = [
  {
    id: 'tea-cup',
    icon: '🍵',
    label: 'tea cup',
    colorVariants: ['#8A9A7B', '#C77B4F'],
  },
  {
    id: 'oil-lamp',
    icon: '🪔',
    label: 'oil lamp',
    colorVariants: ['#8A9A7B', '#D9A441'],
  },
  {
    id: 'basket',
    icon: '🧺',
    label: 'basket',
    colorVariants: ['#8A9A7B', '#C77B4F'],
  },
  {
    id: 'flower',
    icon: '🌸',
    label: 'flower',
    colorVariants: ['#8A9A7B', '#D9A441'],
  },
  {
    id: 'grain',
    icon: '🌾',
    label: 'grain',
    colorVariants: ['#8A9A7B', '#6B4F3B'],
  },
];

/**
 * Difficulty → board shape. Person 4's difficulty engine will eventually
 * drive `tier` here; for now this table is the whole difficulty model.
 *
 *  - gridSize: how many tiles on screen (more = harder to scan)
 *  - changeSubtlety: 'color' (easy, obvious swap) later extendable to
 *    'size' / 'position' for higher tiers
 *  - hintDelayMs: how long before a gentle hint nudge appears unprompted
 */
export const DIFFICULTY_CONFIG = {
  1: { gridSize: 4, changeSubtlety: 'color', hintDelayMs: 20000 },
  2: { gridSize: 6, changeSubtlety: 'color', hintDelayMs: 15000 },
  3: { gridSize: 6, changeSubtlety: 'color', hintDelayMs: 10000 },
  4: { gridSize: 9, changeSubtlety: 'color', hintDelayMs: 8000 },
  5: { gridSize: 9, changeSubtlety: 'color', hintDelayMs: 6000 },
};
