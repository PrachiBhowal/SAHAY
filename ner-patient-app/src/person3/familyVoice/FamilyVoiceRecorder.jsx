import { useEffect, useRef, useState } from "react";

export default function FamilyVoiceRecorder({
  onRecordingReady = () => {},
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      mediaStreamRef.current
        ?.getTracks()
        .forEach((track) => track.stop());
    };
  }, [audioUrl]);

  async function startRecording() {
    setErrorMessage("");

    if (
      !navigator.mediaDevices?.getUserMedia ||
      !("MediaRecorder" in window)
    ) {
      setErrorMessage(
        "Audio recording is not supported in this browser.",
      );
      return;
    }

    try {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl("");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const preferredMimeType = "audio/webm;codecs=opus";

      const recorderOptions = MediaRecorder.isTypeSupported(
        preferredMimeType,
      )
        ? { mimeType: preferredMimeType }
        : undefined;

      const mediaRecorder = new MediaRecorder(
        stream,
        recorderOptions,
      );

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType =
          mediaRecorder.mimeType || "audio/webm";

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType,
        });

        const recordingUrl = URL.createObjectURL(audioBlob);

        setAudioUrl(recordingUrl);
        onRecordingReady(audioBlob);

        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Unable to start family voice recording:", error);

      setErrorMessage(
        "Microphone access was unavailable. Please allow microphone permission and try again.",
      );

      setIsRecording(false);
    }
  }

  function stopRecording() {
    if (
      mediaRecorderRef.current?.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  }

  function clearRecording() {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioUrl("");
    audioChunksRef.current = [];
    onRecordingReady(null);
  }

  return (
    <section>
      <h2>Record a family voice reminder</h2>

      <p>
        Record a familiar voice message that will play with the
        patient’s reminder.
      </p>

      {errorMessage && (
        <p role="alert">{errorMessage}</p>
      )}

      {!isRecording && !audioUrl && (
        <button type="button" onClick={startRecording}>
          Start recording
        </button>
      )}

      {isRecording && (
        <>
          <p role="status">Recording in progress...</p>

          <button type="button" onClick={stopRecording}>
            Stop recording
          </button>
        </>
      )}

      {audioUrl && (
        <>
          <h3>Preview recording</h3>

          <audio controls src={audioUrl}>
            Your browser does not support audio playback.
          </audio>

          <div>
            <button type="button" onClick={clearRecording}>
              Record again
            </button>
          </div>
        </>
      )}
    </section>
  );
}