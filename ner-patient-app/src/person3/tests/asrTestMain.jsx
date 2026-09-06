import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ASRTest from "./ASRTest.jsx";
import "../../index.css";

createRoot(document.getElementById("person3-test-root")).render(
  <StrictMode>
    <ASRTest />
  </StrictMode>,
);