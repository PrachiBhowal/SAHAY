import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

/**
 * SundownContext — Person 2's shared module (sundown mode).
 *
 * Checks the device clock every minute; if the hour falls inside the
 * configured evening window, applies data-sundown="true" to <html>,
 * which tokens.css picks up (dimmer palette, slower transitions).
 * Also exposes `audioVolumeMultiplier` so Game 2's background music
 * and any other audio (Person 3's voice reminders, comfort de-
 * escalation sounds) can quiet down automatically during sundown.
 *
 * TESTING WITHOUT CHANGING THE DEVICE CLOCK:
 * The Day 3 task says "test by changing device clock", but that's
 * slow to iterate on and unreliable on some OSes/browsers. This
 * context also accepts a dev override — call `setDevHourOverride(19)`
 * from a debug panel or the browser console to simulate any hour
 * instantly. Set it back to `null` to resume reading the real clock.
 * Strip the override path (or gate it behind an env flag) before the
 * final demo build if you don't want it reachable on stage.
 */

const SundownContext = createContext(null);

const DEFAULT_START_HOUR = 17; // 5 PM
const DEFAULT_END_HOUR = 20; // 8 PM (mode ends, night mode is out of scope here)

export function SundownProvider({
  children,
  startHour = DEFAULT_START_HOUR,
  endHour = DEFAULT_END_HOUR,
}) {
  const [devHourOverride, setDevHourOverride] = useState(null);
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());

  useEffect(() => {
    if (devHourOverride !== null) return undefined; // don't poll the clock while overridden
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(interval);
  }, [devHourOverride]);

  const effectiveHour = devHourOverride !== null ? devHourOverride : currentHour;

  const isSundown = useMemo(
    () => effectiveHour >= startHour && effectiveHour < endHour,
    [effectiveHour, startHour, endHour]
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-sundown', isSundown ? 'true' : 'false');
  }, [isSundown]);

  const setDevHour = useCallback((hour) => {
    setDevHourOverride(hour);
  }, []);

  const clearDevHour = useCallback(() => {
    setDevHourOverride(null);
    setCurrentHour(new Date().getHours());
  }, []);

  const value = {
    isSundown,
    effectiveHour,
    // Lower background audio ~40% during sundown rather than muting —
    // still present, just gentler
    audioVolumeMultiplier: isSundown ? 0.6 : 1,
    // dev-only testing helpers
    devHourOverride,
    setDevHourOverride: setDevHour,
    clearDevHourOverride: clearDevHour,
  };

  return (
    <SundownContext.Provider value={value}>{children}</SundownContext.Provider>
  );
}

export function useSundown() {
  const ctx = useContext(SundownContext);
  if (!ctx) {
    throw new Error('useSundown must be used within a SundownProvider');
  }
  return ctx;
}
