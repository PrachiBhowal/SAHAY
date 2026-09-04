import React from 'react';
import './GamosaBorder.css';

/**
 * GamosaBorder — original geometric border motif, inspired by (not
 * copied from) Assamese Gamosa textile borders. See gamosa-border.svg
 * for provenance notes and NER_Visual_Assets_Handoff.docx for the
 * research this responds to.
 *
 * Two presentation modes per Prachi's suggested applications:
 *   - "strip"  → thin horizontal band, full opacity. For login card
 *     top/bottom border, or the dashboard sidebar strip near the logo.
 *   - "corner" → same asset, low-opacity, positioned as a corner
 *     accent. For Person 1's game screens — pass this to Anvi rather
 *     than wiring it into a game directly, since Game 1 is her screen.
 *
 * Usage:
 *   <GamosaBorder mode="strip" />
 *   <GamosaBorder mode="corner" style={{ position: 'absolute', top: 0, right: 0, width: 96 }} />
 */
export function GamosaBorder({ mode = 'strip', className = '', style = {} }) {
  return (
    <div
      className={`gamosa-border gamosa-border--${mode} ${className}`}
      style={style}
      role="presentation"
      aria-hidden="true"
    />
  );
}
