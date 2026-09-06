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
import { createContext, useCallback, useContext, useState } from "react";
import { fireComfortTrigger } from "./comfortEngine";
import "./ComfortTrigger.css";

const ComfortTriggerContext = createContext(null);

export function useComfortTrigger() {
  return useContext(ComfortTriggerContext);
}

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
    <div className="comfort-trigger">
      <button
        className="comfort-trigger-button"
        onClick={handlePress}
        disabled={isSubmitting}
        aria-label="I'm not feeling okay"
      >
        {isSubmitting ? "One moment..." : "Need a calm moment?"}
      </button>
      {error && (
        <p className="comfort-trigger-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function ComfortOverlay({ comfortContent, onClose }) {
  return (
    <div className="comfort-overlay" role="dialog" aria-label="A comforting moment">
      <p className="comfort-overlay-title">
        Let's take a moment together.
      </p>

      {comfortContent?.type === "photo" && (
        <img
          src={comfortContent.url}
          alt="A cherished memory"
          className="comfort-overlay-media"
        />
      )}

      {comfortContent?.type === "voice" && (
        <audio controls autoPlay src={comfortContent.url} className="comfort-overlay-media" />
      )}

      {comfortContent?.type === "music" && (
        <audio controls autoPlay src={comfortContent.url} className="comfort-overlay-media" />
      )}

      {!comfortContent && (
        <p className="comfort-overlay-message">
          Take a slow breath. You're safe, and someone who cares about you is nearby.
        </p>
      )}

      <button
        className="comfort-overlay-close"
        onClick={onClose}
      >
        I'm ready to continue
      </button>
    </div>
  );
}

/**
 * Example composition — drop this into a game screen or a global layout.
 */
export function ComfortTriggerContainer({ patientId, apiBaseUrl, authToken, children }) {
  const [activeComfort, setActiveComfort] = useState(null); // { alertLog, comfortContent } | null

  return (
    <ComfortTriggerContext.Provider value={setActiveComfort}>
      <NotOkayButton
        patientId={patientId}
        apiBaseUrl={apiBaseUrl}
        authToken={authToken}
        onComfortReady={setActiveComfort}
      />
      {children}
      {activeComfort && (
        <ComfortOverlay
          comfortContent={activeComfort.comfortContent}
          onClose={() => setActiveComfort(null)}
        />
      )}
    </ComfortTriggerContext.Provider>
  );
}
