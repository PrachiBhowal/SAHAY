import React from 'react';
import './Button.css';

/**
 * Button — shared large-touch-target button, per CONTRACTS.md Section 8
 * (--touch-target-min) and AI_HANDOFF Section 7 (min ~64px targets,
 * generous spacing).
 *
 * Hand this to Person 1 (Game 1), Person 3 (Game 3), Person 4 (Game 4)
 * so every game shares the same tappable-control feel rather than each
 * person styling buttons independently.
 *
 * variant: 'primary' | 'secondary' | 'ghost'
 *   primary   — terracotta fill, dark text (terracotta fails 4.5:1 with
 *               light text — see design-system/README.md). Use for the
 *               single main action on a screen.
 *   secondary — outlined, brown border, transparent fill. Use for
 *               "go back" / less-emphasized actions.
 *   ghost     — no border, minimal chrome. Use for tertiary actions
 *               (e.g. "skip", "not now").
 *
 * size: 'default' | 'large'
 *   large bumps the minimum tap area further for screens where extra-
 *   large text mode is likely (e.g. reminders, home shell).
 */
export function Button({
  children,
  variant = 'primary',
  size = 'default',
  onClick,
  disabled = false,
  type = 'button',
  ariaLabel,
  className = '',
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
