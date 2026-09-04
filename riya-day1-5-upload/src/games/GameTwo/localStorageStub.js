/**
 * STUB — matches the interface Person 1 committed to in CONTRACTS.md
 * Section 6 exactly:
 *
 *   saveSession(session: GameSession): Promise<void>
 *   getPatientData(): Promise<Patient>
 *   queueForSync(item: GameSession | AlertLog): Promise<void>
 *
 * This lets Game 2 be built and tested today without blocking on
 * Person 1's IndexedDB layer landing first. Once it ships, delete this
 * file and change the import in useGameTwoLogic.js from:
 *   import { saveSession } from './localStorageStub';
 * to:
 *   import { saveSession } from '<path-to-person1-module>';
 * Nothing else in Game 2 should need to change — that's the point of
 * building against the documented interface instead of talking to
 * IndexedDB directly.
 */

const STUB_KEY = 'game2-session-stub-log';

export async function saveSession(session) {
  // eslint-disable-next-line no-console
  console.info('[stub saveSession]', session);
  try {
    const existing = JSON.parse(window.localStorage.getItem(STUB_KEY) || '[]');
    existing.push({ ...session, synced: false });
    window.localStorage.setItem(STUB_KEY, JSON.stringify(existing));
  } catch {
    // stub only — real layer handles this properly
  }
}

export async function getPatientData() {
  return {
    id: 'stub-patient-1',
    name: 'Demo Patient',
    language_pref: 'as',
    region_village: 'Demo Village',
    difficulty_tiers: { memory: 2, attention: 2, recall: 2, pattern: 2 },
    created_at: new Date().toISOString(),
  };
}

export async function queueForSync(item) {
  // eslint-disable-next-line no-console
  console.info('[stub queueForSync]', item);
}
