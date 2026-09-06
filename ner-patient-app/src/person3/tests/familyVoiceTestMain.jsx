import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import FamilyVoiceRecorderTest from "./FamilyVoiceRecorderTest";
import "../../index.css";

createRoot(document.getElementById("person3-family-voice-root")).render(
  <StrictMode>
    <FamilyVoiceRecorderTest />
  </StrictMode>,
);