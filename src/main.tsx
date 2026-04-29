import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css"; // Dark mode - optimized for long work sessions

createRoot(document.getElementById("root")!).render(<App />);