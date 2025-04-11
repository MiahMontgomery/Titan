import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { SocketProvider } from "./components/ui/socket-provider";

createRoot(document.getElementById("root")!).render(
  <SocketProvider>
    <App />
  </SocketProvider>
);
