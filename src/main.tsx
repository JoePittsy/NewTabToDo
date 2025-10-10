import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";



createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
        <div className="p-1">
            <App />
        </div>
    </StrictMode>
);
