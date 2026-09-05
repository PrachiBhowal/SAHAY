// src/hooks/useASR.js
//
// Real interface, locked in CONTRACTS.md Section 6:
//   useASR(): { transcript: string, isListening: boolean, startListening: () => void }
//
// Person 3 owns the real implementation (Bhashini ASR integration).
// This file is a placeholder ONLY — it does not fake listening or
// produce fake transcripts. It reports itself as not ready, and the
// UI that calls it must respect that rather than pretending to work.
//
// Person 3: replace the body of this function with the real Bhashini
// call. Keep the exported shape identical so nothing else needs to change.

export function useASR() {
  return {
    transcript: '',
    isListening: false,
    isReady: false, // NOT part of the locked contract shape — added so
                     // calling UI can honestly disable itself instead of
                     // faking a working mic. Flag to team if this should
                     // be added to CONTRACTS.md Section 6 officially.
    startListening: () => {
      console.warn('useASR: real ASR not yet implemented (Person 3)')
    }
  }
}