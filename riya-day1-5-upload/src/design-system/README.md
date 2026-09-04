# Design System — Person 2's shared module

Covers CONTRACTS.md Section 8 (design tokens) plus font-scale and
high-contrast support (Day 1 tasks).

## Files
- `tokens.css` — all CSS custom properties. Import once at the app root.
- `AccessibilityContext.jsx` — React context for font-scale + high-contrast state.
- `AccessibilityToggle.jsx` / `.css` — ready-made settings control.
- `index.js` — barrel export.

## Setup (once, in App.jsx or index.js)

```jsx
import './design-system/tokens.css';
import { AccessibilityProvider } from './design-system';

function App() {
  return (
    <AccessibilityProvider>
      {/* rest of the app */}
    </AccessibilityProvider>
  );
}
```

## Using tokens in your own CSS
Never hardcode hex values, font sizes, or touch-target sizes. Reference
the variable names:

```css
.my-button {
  min-height: var(--touch-target-min);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: calc(var(--font-size-base) * var(--font-scale));
}
```

Using `calc(... * var(--font-scale))` (not just `var(--font-size-base)`
alone) is what makes the "even larger" text toggle actually affect your
screen. If you hardcode `20px`, the toggle won't touch it.

## Using the toggle in your own screens
```jsx
import { useAccessibility } from '../design-system';

function MyScreen() {
  const { fontScale, highContrast } = useAccessibility();
  // read-only access if you just need to react to current settings
}
```

Or drop the ready-made control anywhere (e.g. Person 1's home shell,
or a settings screen):
```jsx
import { AccessibilityToggle } from '../design-system';

<AccessibilityToggle />
```

## Notes on the token choices
- Terracotta (#C77B4F) is decorative/fill only — it's ~2.9:1 against the
  cream background with light text, which fails WCAG AA. Buttons use
  dark text (`--color-on-primary`) on terracotta fills, not white.
- Sage and ochre are similarly too low-contrast for text (~2.0–2.1:1) —
  use them for badges, icons, and fills, never for text color.
- Brown (#6B4F3B) / near-black text on the cream background is the only
  combination that clears AAA (~11.6:1) — that's the default body text.
- High-contrast mode (`data-high-contrast="true"`, toggled automatically)
  switches to pure black-on-white and darkens the three accent hues so
  they clear 4.5:1 too, rather than just cranking up the base palette.

## Still open / needs your input
- Confirm the 3-step font scale (Standard / Large / Extra-large) matches
  what `--font-size-base/lg/xl` implied in CONTRACTS.md — I mapped them
  1:1 (20px / 26px / 32px) via multiplier rather than swapping fixed
  sizes, so it composes cleanly with any font-size in the app, not just
  three predefined ones.
- `AccessibilityToggle` currently renders as a standalone panel — decide
  where it lives in the real nav (settings screen vs. persistent home
  shell icon) once Person 1's app shell exists.
