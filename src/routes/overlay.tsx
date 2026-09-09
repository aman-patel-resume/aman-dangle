import { useEffect, useRef } from "react";
import { useHearth } from "@/store/hearth";
import { HangingCharm } from "@/components/hanging-charm";

/**
 * OverlayPage - clean desktop overlay window loaded by Electron.
 * Displays ONLY the charm floating over the desktop screen. Controls are handled
 * from the web control dashboard at http://localhost:8080.
 */

export function OverlayPage() {
    const enabled = useHearth((s) => s.enabled);
    const position = useHearth((s) => s.position);
    const threadLength = useHearth((s) => s.threadLength);
    const charmId = useHearth((s) => s.charmId);
    const flickToken = useHearth((s) => s.flickToken);

    const rootRef = useRef<HTMLDivElement | null>(null);
    const sourcesRef = useRef<Set<string>>(new Set());
    const lastInteractiveRef = useRef(false);

    // Rehydrate persisted zustand state
    useEffect(() => {
        void useHearth.persist.rehydrate();
    }, []);

    // Force transparent background for Electron overlay
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
            <div style={{ position: "absolute", inset: 0 }}>
                <HangingCharm
                    charmId={charmId}
                    position={position}
                    threadLength={threadLength}
                    enabled={enabled}
                    interactive
                    flickToken={flickToken}
                    onInteractionChange={(active) => setInteractive("charm", active)}
                />
            </div>
        </div>
    );
}
