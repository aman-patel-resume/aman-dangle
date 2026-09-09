// electron/preload.cjs — Secure bridge between Electron main and the React renderer.

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("overlayAPI", {
    /** True when the page is running inside Electron. */
    isElectron: true,

    /**
     * Tell the main process whether the pointer is currently over an
     * interactive region (the charm, etc.).
     *   active = true  → accept mouse events on this window
     *   active = false → let clicks pass through to the desktop
     */
    setInteractive: (active) => {
        ipcRenderer.send("overlay:set-interactive", !!active);
    },

    /** Send updated hearth state to main process to broadcast to overlay. */
    sendState: (state) => {
        ipcRenderer.send("overlay:send-state", state);
    },

    /** Subscribe to hearth state updates from main process. */
    onStateChanged: (callback) => {
        const handler = (_event, state) => callback(state);
        ipcRenderer.on("overlay:state-changed", handler);
        return () => ipcRenderer.removeListener("overlay:state-changed", handler);
    },

    /** Ask the main process to open the web control dashboard in browser. */
    openControlWeb: () => {
        ipcRenderer.send("overlay:open-control-web");
    },

    /** Ask the main process to quit the application. */
    quit: () => {
        ipcRenderer.send("overlay:quit");
    },
});
