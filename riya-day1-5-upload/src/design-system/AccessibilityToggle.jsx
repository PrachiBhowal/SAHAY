import React from 'react';
import { useAccessibility } from './AccessibilityContext';
import './AccessibilityToggle.css';

/**
 * AccessibilityToggle — drop-in settings control.
 *
 * Meant for a settings screen or a persistent corner of the home shell
 * (Person 1's app shell). Buttons meet --touch-target-min (64px) and
 * use plain-language labels rather than icon-only controls, per the
 * "elderly-friendly, accessible UI" requirement.
 */
export function AccessibilityToggle() {
  const {
    fontScaleLabel,
    fontScaleSteps,
    fontScaleIndex,
    setFontScaleIndex,
    highContrast,
    toggleHighContrast,
  } = useAccessibility();

  return (
    <div className="a11y-toggle" role="group" aria-label="Display settings">
      <div className="a11y-toggle__row">
        <span className="a11y-toggle__label">Text size: {fontScaleLabel}</span>
        <div className="a11y-toggle__segmented">
          {fontScaleSteps.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`a11y-toggle__segment ${i === fontScaleIndex ? 'is-active' : ''}`}
              aria-pressed={i === fontScaleIndex}
              onClick={() => setFontScaleIndex(i)}
            >
              A{i > 0 ? '+'.repeat(i) : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="a11y-toggle__row">
        <span className="a11y-toggle__label">High contrast</span>
        <button
          type="button"
          className={`a11y-toggle__switch ${highContrast ? 'is-on' : ''}`}
          role="switch"
          aria-checked={highContrast}
          onClick={toggleHighContrast}
        >
          {highContrast ? 'On' : 'Off'}
        </button>
      </div>
    </div>
  );
}
