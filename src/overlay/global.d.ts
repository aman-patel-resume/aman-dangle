// Typings for the bridge exposed by electron/preload.cjs.
// In a plain browser (no Electron) `window.overlayAPI` is simply undefined.
interface OverlayAPI {
    isElectron: boolean;
    setInteractive: (active: boolean) => void;
    sendState: (state: any) => void;
    onStateChanged: (callback: (state: any) => void) => () => void;
    openControlWeb: () => void;
    quit: () => void;
}

interface Window {
    overlayAPI?: OverlayAPI;
}
