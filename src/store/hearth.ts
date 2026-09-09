import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CharmId } from "@/lib/charms";

type HearthState = {
    enabled: boolean;
    position: number;
    threadLength: number;
    idleSpeed: number;
    hoverSpeed: number;
    charmId: CharmId;
    flickToken: number;
    setEnabled: (enabled: boolean) => void;
    setPosition: (position: number) => void;
    setThreadLength: (threadLength: number) => void;
    setIdleSpeed: (idleSpeed: number) => void;
    setHoverSpeed: (hoverSpeed: number) => void;
    setCharmId: (charmId: CharmId) => void;
    flick: () => void;
};

export const useHearth = create<HearthState>()(
    persist(
        (set) => ({
            enabled: true,
            position: 50,
            threadLength: 140,
            idleSpeed: 50,
            hoverSpeed: 50,
            charmId: "nimbu-mirchi",
            flickToken: 0,
            setEnabled: (enabled) => set({ enabled }),
            setPosition: (position) => set({ position: Math.min(92, Math.max(8, position)) }),
            setThreadLength: (threadLength) =>
                set({ threadLength: Math.min(700, Math.max(40, threadLength)) }),
            setIdleSpeed: (idleSpeed) => set({ idleSpeed: Math.min(100, Math.max(0, idleSpeed)) }),
            setHoverSpeed: (hoverSpeed) => set({ hoverSpeed: Math.min(100, Math.max(0, hoverSpeed)) }),
            setCharmId: (charmId) => set({ charmId }),
            flick: () => set((s) => ({ flickToken: s.flickToken + 1 })),
        }),
        {
            name: "hearth-settings",
            storage: createJSONStorage(() => localStorage),
            skipHydration: false,
            partialize: (s) => ({
                enabled: s.enabled,
                position: s.position,
                threadLength: s.threadLength,
                idleSpeed: s.idleSpeed,
                hoverSpeed: s.hoverSpeed,
                charmId: s.charmId,
            }),
        },
    ),
);

// Synchronize state across Web Dashboard & Desktop Overlay in real-time
if (typeof window !== "undefined") {
    let isApplyingRemote = false;

    // Helper to safely apply remote state without triggering endless echo loops
    const applyRemoteState = (remote: any) => {
        if (!remote || typeof remote !== "object") return;
        const current = useHearth.getState();
        const diff: Partial<HearthState> = {};

        if (typeof remote.enabled === "boolean" && remote.enabled !== current.enabled) {
            diff.enabled = remote.enabled;
        }
        if (typeof remote.position === "number" && remote.position !== current.position) {
            diff.position = remote.position;
        }
        if (typeof remote.threadLength === "number" && remote.threadLength !== current.threadLength) {
            diff.threadLength = remote.threadLength;
        }
        if (typeof remote.idleSpeed === "number" && remote.idleSpeed !== current.idleSpeed) {
            diff.idleSpeed = remote.idleSpeed;
        }
        if (typeof remote.hoverSpeed === "number" && remote.hoverSpeed !== current.hoverSpeed) {
            diff.hoverSpeed = remote.hoverSpeed;
        }
        if (typeof remote.charmId === "string" && remote.charmId !== current.charmId) {
            diff.charmId = remote.charmId as CharmId;
        }
        if (typeof remote.flickToken === "number" && remote.flickToken !== current.flickToken) {
            diff.flickToken = remote.flickToken;
        }

        if (Object.keys(diff).length > 0) {
            isApplyingRemote = true;
            useHearth.setState(diff);
            isApplyingRemote = false;
        }
    };

    // 1. Instant cross-window sync via BroadcastChannel
    const channel = new BroadcastChannel("dangle-realtime-channel");
    channel.onmessage = (event) => applyRemoteState(event.data);

    // 2. Storage event listener fallback
    window.addEventListener("storage", (e) => {
        if (e.key === "hearth-settings" && e.newValue) {
            try {
                const parsed = JSON.parse(e.newValue);
                if (parsed.state) applyRemoteState(parsed.state);
            } catch (_) {}
        }
    });

    // 3. Electron IPC listener (when running inside Electron app window)
    if ((window as any).overlayAPI?.onStateChanged) {
        (window as any).overlayAPI.onStateChanged((state: any) => applyRemoteState(state));
    }

    // 4. Polling backup for Electron window to ensure live sync with http://localhost:8080
    const isOverlayPage =
        window.location.pathname.includes("/overlay") ||
        window.location.hash.includes("overlay") ||
        window.location.search.includes("overlay");

    if (isOverlayPage) {
        setInterval(() => {
            fetch("http://127.0.0.1:8085/api/state")
                .then((res) => res.json())
                .then((remote) => applyRemoteState(remote))
                .catch(() => {});
        }, 200);
    }

    // 5. Subscribe to local state changes and push to BroadcastChannel, Electron IPC & HTTP server
    useHearth.subscribe((state) => {
        if (isApplyingRemote) return;

        const payload = {
            enabled: state.enabled,
            position: state.position,
            threadLength: state.threadLength,
            idleSpeed: state.idleSpeed,
            hoverSpeed: state.hoverSpeed,
            charmId: state.charmId,
            flickToken: state.flickToken,
        };

        // Broadcast to desktop overlay & other tabs instantly
        channel.postMessage(payload);

        // Send to Electron IPC if inside Electron
        if ((window as any).overlayAPI?.sendState) {
            (window as any).overlayAPI.sendState(payload);
        }

        // Send to Electron HTTP API server (port 8085) if website is opened in browser
        fetch("http://127.0.0.1:8085/api/state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }).catch(() => {});
    });
}