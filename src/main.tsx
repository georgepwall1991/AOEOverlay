import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";

// WORKAROUND: WebView2 on Windows has issues rendering content inside #root
// when the window is transparent. We create our own container outside #root
// and render React there instead.

// Create a new container for React, bypassing the problematic #root
const reactContainer = document.createElement("div");
reactContainer.id = "react-app-container";
reactContainer.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
`;
document.body.appendChild(reactContainer);

// Create an inner div that will receive pointer events
const appWrapper = document.createElement("div");
appWrapper.id = "app-wrapper";
appWrapper.style.cssText = `
  pointer-events: auto;
  display: inline-block;
`;
reactContainer.appendChild(appWrapper);

// Hide the original #root since we're not using it
const originalRoot = document.getElementById("root");
if (originalRoot) {
  originalRoot.style.display = "none";
}

// Render React immediately into our new container
const root = ReactDOM.createRoot(appWrapper);
root.render(<App />);

const isWindows =
  typeof navigator !== "undefined" && /Windows/i.test(navigator.userAgent);
const isMockTauri = import.meta.env.VITE_MOCK_TAURI === "true";

if (isWindows && !isMockTauri) {
  // Mimic a single Fast Refresh to kick WebView2 compositing on cold start.
  setTimeout(() => {
    root.unmount();
    ReactDOM.createRoot(appWrapper).render(<App />);
  }, 1000);
}
