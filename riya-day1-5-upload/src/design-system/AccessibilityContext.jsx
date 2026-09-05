import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * AccessibilityContext — Person 2's shared module
 *
 * Provides font-scale and high-contrast state to the whole app.
 * Wrap the app root with <AccessibilityProvider> (in App.jsx / index.js),
 * then call useAccessibility() anywhere to read or change settings.
 *
 * Persists choices in localStorage so they survive a reload — important
 * since this is an elderly-user-facing app; nobody should have to
 * re-configure font size or contrast every session.
 */

const STORAGE_KEY = 'ner-care-accessibility';

// Three steps, matching the base/lg/xl scale already defined in tokens.css.
// 1 = base (20px), 1.3 = large (~26px), 1.6 = extra-large (~32px)
const FONT_SCALE_STEPS = [1, 1.3, 1.6];
const FONT_SCALE_LABELS = ['Standard', 'Large', 'Extra large'];

const AccessibilityContext = createContext(null);

function loadInitialState() {
  if (typeof window === 'undefined') {
    return { fontScaleIndex: 0, highContrast: false };
  }
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // fall through to defaults if storage is unavailable or corrupt
  }
  return { fontScaleIndex: 0, highContrast: false };
}

export function AccessibilityProvider({ children }) {
  const [{ fontScaleIndex, highContrast }, setState] = useState(loadInitialState);

  // Reflect state onto the document so tokens.css picks it up
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--font-scale',
      String(FONT_SCALE_STEPS[fontScaleIndex])
    );
    document.documentElement.setAttribute(
      'data-high-contrast',
      highContrast ? 'true' : 'false'
    );
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ fontScaleIndex, highContrast })
      );
    } catch {
      // non-fatal — settings just won't persist this session
    }
  }, [fontScaleIndex, highContrast]);

  const cycleFontScale = useCallback(() => {
    setState((s) => ({
      ...s,
      fontScaleIndex: (s.fontScaleIndex + 1) % FONT_SCALE_STEPS.length,
    }));
  }, []);

  const setFontScaleIndex = useCallback((index) => {
    if (index < 0 || index >= FONT_SCALE_STEPS.length) return;
    setState((s) => ({ ...s, fontScaleIndex: index }));
  }, []);

  const toggleHighContrast = useCallback(() => {
    setState((s) => ({ ...s, highContrast: !s.highContrast }));
  }, []);

  const value = {
    fontScale: FONT_SCALE_STEPS[fontScaleIndex],
    fontScaleIndex,
    fontScaleLabel: FONT_SCALE_LABELS[fontScaleIndex],
    fontScaleSteps: FONT_SCALE_STEPS,
    fontScaleLabels: FONT_SCALE_LABELS,
    cycleFontScale,
    setFontScaleIndex,
    highContrast,
    toggleHighContrast,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return ctx;
}
