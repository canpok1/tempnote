import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "@picocss/pico/css/pico.jade.min.css";
import "./style.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
