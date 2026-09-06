import React from 'react';
import { useSundown } from './SundownContext';

/**
 * SundownDevPanel — dev-only. Lets you scrub through hours to test
 * sundown mode instantly instead of changing the device clock.
 *
 * Mount this somewhere reachable during development (e.g. behind a
 * `?debug=1` query flag) and REMOVE or hide it before the Day 6 demo
 * build — it's a testing aid, not a patient/caregiver-facing feature.
 */
export function SundownDevPanel() {
  const { effectiveHour, devHourOverride, setDevHourOverride, clearDevHourOverride, isSundown } =
    useSundown();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        right: 12,
        background: '#FFFFFF',
        border: '2px solid #6B4F3B',
        borderRadius: 12,
        padding: 12,
        fontSize: 13,
        zIndex: 9999,
        maxWidth: 220,
      }}
    >
      <div style={{ marginBottom: 8, fontWeight: 700 }}>
        Sundown dev panel — {isSundown ? 'ON' : 'off'} (hour {effectiveHour})
      </div>
      <input
        type="range"
        min="0"
        max="23"
        value={effectiveHour}
        onChange={(e) => setDevHourOverride(Number(e.target.value))}
        style={{ width: '100%' }}
      />
      <button
        type="button"
        onClick={clearDevHourOverride}
        disabled={devHourOverride === null}
        style={{ marginTop: 8, fontSize: 12 }}
      >
        Resume real clock
      </button>
    </div>
  );
}
