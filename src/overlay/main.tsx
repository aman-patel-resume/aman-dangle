/**
 * src/overlay/main.tsx — Vite SPA entry for the Electron overlay.
 *
 * Renders ONLY the hanging physics charm directly over the desktop.
 * All controls are handled remotely via the Web Dashboard / Control Panel.
 */

import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { useHearth } from "@/store/hearth";
import { HangingCharm } from "@/components/hanging-charm";
import "@/styles.css";

function OverlayApp() {
    const enabled = useHearth((s) => s.enabled);
    const position = useHearth((s) => s.position);
    const threadLength = useHearth((s) => s.threadLength);
    const idleSpeed = useHearth((s) => s.idleSpeed ?? 50);
    const hoverSpeed = useHearth((s) => s.hoverSpeed ?? 50);
    const charmId = useHearth((s) => s.charmId);
    const setEnabled = useHearth((s) => s.setEnabled);
    const setPosition = useHearth((s) => s.setPosition);
    const setThreadLength = useHearth((s) => s.setThreadLength);
    const setIdleSpeed = useHearth((s) => s.setIdleSpeed);
    const setHoverSpeed = useHearth((s) => s.setHoverSpeed);
    const setCharmId = useHearth((s) => s.setCharmId);

    const [flickToken, setFlickToken] = useState(0);

    const rootRef = useRef<HTMLDivElement | null>(null);
    const sourcesRef = useRef<Set<string>>(new Set());
    const lastInteractiveRef = useRef(false);

    // Rehydrate persisted zustand state.
    useEffect(() => {
        void useHearth.persist.rehydrate();
    }, []);

    // Listen for remote state updates from the Web Control Panel via Electron IPC
    useEffect(() => {
        if ((window as any).overlayAPI?.onStateChanged) {
            const cleanup = (window as any).overlayAPI.onStateChanged((state: any) => {
                if (typeof state.enabled === "boolean") setEnabled(state.enabled);
                if (typeof state.position === "number") setPosition(state.position);
                if (typeof state.threadLength === "number") setThreadLength(state.threadLength);
                if (typeof state.idleSpeed === "number") setIdleSpeed(state.idleSpeed);
                if (typeof state.hoverSpeed === "number") setHoverSpeed(state.hoverSpeed);
                if (typeof state.charmId === "string") setCharmId(state.charmId);
                if (typeof state.flickToken === "number") setFlickToken(state.flickToken);
            });
            return cleanup;
        }
    }, [setEnabled, setPosition, setThreadLength, setIdleSpeed, setHoverSpeed, setCharmId]);

    // Force a fully transparent background so only the charm floats over desktop
    useEffect(() => {
        document.documentElement.style.background = "transparent";
        document.body.style.background = "transparent";
        document.body.style.margin = "0";
        document.body.style.overflow = "hidden";

        let el: HTMLElement | null = rootRef.current;
        while (el && el !== document.documentElement) {
            el.style.background = "transparent";
            el.style.boxShadow = "none";
            el.style.border = "none";
            el = el.parentElement;
        }
    }, []);

    /** Forward pointer interaction state (hover/drag) to Electron for click-through */
    const setInteractive = (id: string, active: boolean) => {
        const s = sourcesRef.current;
        if (active) s.add(id);
        else s.delete(id);
        const on = s.size > 0;
        if (on !== lastInteractiveRef.current) {
            lastInteractiveRef.current = on;
            (window as any).overlayAPI?.setInteractive(on);
        }
    };

    return (
        <div
            ref={rootRef}
            style={{
                position: "fixed",
                inset: 0,
                overflow: "hidden",
                background: "transparent",
                userSelect: "none",
                WebkitUserSelect: "none",
            }}
        >
            {/* Clean Hanging Charm on screen — No gear button or overlay chrome */}
            <div style={{ position: "absolute", inset: 0 }}>
                <HangingCharm
                    charmId={charmId}
                    position={position}
                    threadLength={threadLength}
                    idleSpeed={idleSpeed}
                    hoverSpeed={hoverSpeed}
                    enabled={enabled}
                    interactive
                    flickToken={flickToken}
                    onInteractionChange={(active) => setInteractive("charm", active)}
                />
            </div>
        </div>
    );
}

// ── Mount ──────────────────────────────────────────────────────
createRoot(document.getElementById("root")!).render(<OverlayApp />);
