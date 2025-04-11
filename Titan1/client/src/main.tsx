<<<<<<< HEAD
// Import crypto polyfill first
import "./polyfills/crypto.js";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { WebSocketProvider } from "./lib/websocket";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WebSocketProvider>
      <App />
    </WebSocketProvider>
  </StrictMode>
);
=======
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
>>>>>>> 1d84bc7 (Set up Node.js project for Titan AI assistant.)
