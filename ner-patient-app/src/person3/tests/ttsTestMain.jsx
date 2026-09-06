import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import TTSTest from "./TTSTest.jsx";
import "../../index.css";

createRoot(document.getElementById("person3-tts-root")).render(
  <StrictMode>
    <TTSTest />
  </StrictMode>,
);