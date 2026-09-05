export default function VoiceSupportNotice({
  asrSupported,
  ttsSupported,
}) {
  if (asrSupported && ttsSupported) {
    return null;
  }

  return (
    <section role="alert" aria-live="polite">
      <h2>Voice feature notice</h2>

      {!asrSupported && (
        <p>
          Voice input is unavailable in this browser. You can type your
          response instead.
        </p>
      )}

      {!ttsSupported && (
        <p>
          Spoken prompts are unavailable in this browser. The prompt will
          remain visible as text, and recorded audio can be used when
          available.
        </p>
      )}
    </section>
  );
}