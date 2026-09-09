import React from "react";
import { createRoot } from "react-dom/client";
import { HomePage } from "@/routes/index";
import { OverlayPage } from "@/routes/overlay";
import "@/styles.css";

function App() {
    const isOverlay =
        window.location.pathname.includes("/overlay") ||
        window.location.hash.includes("overlay") ||
        window.location.search.includes("overlay");

    return isOverlay ? <OverlayPage /> : <HomePage />;
}

createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
