import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

import { PsychedelicSpiral } from "./components/ui/shadcn-io/psychedelic-spiral";

createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
        <div className="p-1">
            <PsychedelicSpiral
                color1="#871d87"
                color2="#b2dfdf"
                color3="#0c204e"
                pixelFilter={1200}
                lighting={0.2}
                // isRotate={true}
                className="fixed inset-0 -z-10"
            />
            <App />
        </div>
    </StrictMode>
);
