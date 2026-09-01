/**
 * ComfortTrigger.jsx
 * Person 4 (Mokshita) — SIH26003
 *
 * Two pieces:
 *  - NotOkayButton: the manual "I'm not okay" button, embeddable in any of
 *    the 4 games or a global nav bar. Large touch target per design tokens
 *    (--touch-target-min: 64px).
 *  - ComfortOverlay: full-screen calming response, shown once a trigger
 *    (manual or 3x low-engagement) fires. Displays the selected MemoryAsset
 *    (photo/voice/music) from comfortEngine.selectComfortContent.
 *
 * Wire-up: pass patientId, apiBaseUrl, authToken as props (or pull from your
 * app's auth/session context — swap the placeholders below for however
 * Person 5's auth is actually threaded through).
 */
import { useState, useCallback } from "react";
import { fireComfortTrigger } from "./comfortEngine";

export function NotOkayButton({ patientId, apiBaseUrl, authToken, onComfortReady }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handlePress = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await fireComfortTrigger({
        patientId,
        triggerType: "manual_distress",
        apiBaseUrl,
        authToken,
      });
      onComfortReady(result);
    } catch (e) {
      setError("Something went wrong — please try again.");
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  }, [patientId, apiBaseUrl, authToken, onComfortReady]);

  return (
    <div>
      <button
        onClick={handlePress}
        disabled={isSubmitting}
        style={{
          minHeight: "var(--touch-target-min, 64px)",
          minWidth: "var(--touch-target-min, 64px)",
          padding: "var(--spacing-unit, 8px) calc(var(--spacing-unit, 8px) * 3)",
          fontSize: "var(--font-size-lg, 26px)",
          borderRadius: "16px",
          border: "none",
          background: "var(--color-terracotta, #C77B4F)",
          color: "#FFF",
          cursor: isSubmitting ? "wait" : "pointer",
        }}
        aria-label="I'm not feeling okay"
      >
        {isSubmitting ? "One moment..." : "I'm not feeling okay"}
      </button>
      {error && (
        <p style={{ color: "var(--color-brown, #6B4F3B)", fontSize: "var(--font-size-base, 20px)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export function ComfortOverlay({ comfortContent, onClose }) {
  return (
    <div
      role="dialog"
      aria-label="A comforting moment"
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--color-background, #FAF6F0)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "calc(var(--spacing-unit, 8px) * 4)",
        zIndex: 1000,
      }}
    >
      <p style={{ fontSize: "var(--font-size-xl, 32px)", color: "var(--color-text, #3A2E24)", marginBottom: "24px" }}>
        Let's take a moment together.
      </p>

      {comfortContent?.type === "photo" && (
        <img
          src={comfortContent.url}
          alt="A cherished memory"
          style={{ maxWidth: "80%", borderRadius: "16px" }}
        />
      )}

      {comfortContent?.type === "voice" && (
        <audio controls autoPlay src={comfortContent.url} style={{ width: "80%" }} />
      )}

      {comfortContent?.type === "music" && (
        <audio controls autoPlay src={comfortContent.url} style={{ width: "80%" }} />
      )}

      {!comfortContent && (
        <p style={{ fontSize: "var(--font-size-base, 20px)", color: "var(--color-text, #3A2E24)" }}>
          Take a slow breath. You're safe, and someone who cares about you is nearby.
        </p>
      )}

      <button
        onClick={onClose}
        style={{
          marginTop: "32px",
          minHeight: "var(--touch-target-min, 64px)",
          padding: "0 32px",
          fontSize: "var(--font-size-lg, 26px)",
          borderRadius: "16px",
          border: "none",
          background: "var(--color-sage, #8A9A7B)",
          color: "#FFF",
        }}
      >
        I'm ready to continue
      </button>
    </div>
  );
}

/**
 * Example composition — drop this into a game screen or a global layout.
 */
export function ComfortTriggerContainer({ patientId, apiBaseUrl, authToken }) {
  const [activeComfort, setActiveComfort] = useState(null); // { alertLog, comfortContent } | null

  return (
    <>
      <NotOkayButton
        patientId={patientId}
        apiBaseUrl={apiBaseUrl}
        authToken={authToken}
        onComfortReady={setActiveComfort}
      />
      {activeComfort && (
        <ComfortOverlay
          comfortContent={activeComfort.comfortContent}
          onClose={() => setActiveComfort(null)}
        />
      )}
    </>
  );
}
