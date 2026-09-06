import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Game3Test from "./Game3Test.jsx";
import "../../index.css";

createRoot(document.getElementById("person3-game-root")).render(
  <StrictMode>
    <Game3Test />
  </StrictMode>,
);