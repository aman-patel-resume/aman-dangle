// electron/main.cjs — Main process for Aman Dangle Desktop System.
const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, shell } = require("electron");
const path = require("node:path");
const http = require("node:http");
const zlib = require("node:zlib");

let win = null; // Overlay window
let controlWin = null; // Control dashboard window
let tray = null; // System tray icon

// Single instance lock: if app is already running, focus the control window on re-launch
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on("second-instance", () => {
        showControlWindow();
    });
}

// Current synchronized state
let currentState = {
    enabled: true,
    position: 50,
    threadLength: 140,
    idleSpeed: 50,
    hoverSpeed: 50,
    charmId: "nimbu-mirchi",
    flickToken: 0,
};

// ───────────────────────────────────────────────────────────────
// Local HTTP Server for External Website / API Control (port 8085)
// ───────────────────────────────────────────────────────────────
function startControlServer() {
    const server = http.createServer((req, res) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
            res.writeHead(204);
            res.end();
            return;
        }

        if (req.url === "/api/state" && req.method === "GET") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(currentState));
            return;
        }

        if (req.url === "/api/state" && req.method === "POST") {
            let body = "";
            req.on("data", (chunk) => {
                body += chunk;
            });
            req.on("end", () => {
                try {
                    const data = JSON.parse(body);
                    currentState = { ...currentState, ...data };
                    broadcastState(currentState);
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ success: true }));
                } catch (err) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Invalid JSON" }));
                }
            });
            return;
        }

        res.writeHead(404);
        res.end("Not Found");
    });

    server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
            console.log("Overlay Control API server port 8085 already in use — reusing existing instance.");
        } else {
            console.error("Overlay Control API server error:", err);
        }
    });

    server.listen(8085, "127.0.0.1", () => {
        console.log("Overlay Remote Control API listening at http://127.0.0.1:8085");
    });
}

function broadcastState(state) {
    if (win && !win.isDestroyed()) {
        win.webContents.send("overlay:state-changed", state);
    }
    if (controlWin && !controlWin.isDestroyed()) {
        controlWin.webContents.send("overlay:state-changed", state);
    }
}

// ───────────────────────────────────────────────────────────────
// System Tray Icon Generator
// ───────────────────────────────────────────────────────────────
function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        c ^= buf[i];
        for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
    return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
    const typeB = Buffer.from(type, "ascii");
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const crcB = Buffer.alloc(4);
    crcB.writeUInt32BE(crc32(Buffer.concat([typeB, data])), 0);
    return Buffer.concat([len, typeB, data, crcB]);
}

function makePng(w, h, rgba) {
    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0);
    ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8;
    ihdr[9] = 6;
    const raw = Buffer.alloc(h * (1 + w * 4));
    for (let y = 0; y < h; y++) {
        raw[y * (1 + w * 4)] = 0;
        rgba.copy(raw, y * (1 + w * 4) + 1, y * w * 4, (y + 1) * w * 4);
    }
    return Buffer.concat([
        sig,
        pngChunk("IHDR", ihdr),
        pngChunk("IDAT", zlib.deflateSync(raw)),
        pngChunk("IEND", Buffer.alloc(0)),
    ]);
}

function createTrayIcon() {
    const s = 16;
    const buf = Buffer.alloc(s * s * 4);
    const cx = 7.5, cy = 7.5, r = 6.5;
    for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
            const i = (y * s + x) * 4;
            const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            if (d <= r) {
                const t = d / r;
                buf[i] = Math.round(242 - t * 40);
                buf[i + 1] = Math.round(213 - t * 70);
                buf[i + 2] = Math.round(126 - t * 70);
                buf[i + 3] = 255;
            }
        }
    }
    return nativeImage.createFromBuffer(makePng(s, s, buf), { width: s, height: s });
}

function getScreenBounds() {
    const primaryDisplay = screen.getPrimaryDisplay();
    return primaryDisplay.bounds;
}

function resetPosition() {
    if (win && !win.isDestroyed()) {
        const bounds = getScreenBounds();
        win.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
    }
}

// ───────────────────────────────────────────────────────────────
// Windows Creation
// ───────────────────────────────────────────────────────────────
function createOverlayWindow() {
    const { width, height } = getScreenBounds();

    win = new BrowserWindow({
        width,
        height,
        x: 0,
        y: 0,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        hasShadow: false,
        focusable: true,
        paintWhenInitiallyHidden: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.cjs"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    win.setIgnoreMouseEvents(true, { forward: true });
    win.setMinimizable(false);
    win.setMaximizable(false);
    win.setAlwaysOnTop(true, "screen-saver");

    const devServerUrl = process.env.VITE_DEV_SERVER_URL;
    if (devServerUrl) {
        win.loadURL(`${devServerUrl.replace(/\/$/, "")}/overlay`);
    } else {
        win.loadFile(path.join(__dirname, "..", "dist", "index.html"), { hash: "/overlay" });
    }
}

function showControlWindow() {
    if (controlWin && !controlWin.isDestroyed()) {
        if (controlWin.isMinimized()) controlWin.restore();
        controlWin.show();
        controlWin.focus();
        return;
    }

    controlWin = new BrowserWindow({
        width: 900,
        height: 720,
        title: "Aman Dangle Control Dashboard",
        autoHideMenuBar: true,
        backgroundColor: "#06080c",
        webPreferences: {
            preload: path.join(__dirname, "preload.cjs"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    const devServerUrl = process.env.VITE_DEV_SERVER_URL;
    if (devServerUrl) {
        controlWin.loadURL(devServerUrl);
    } else {
        controlWin.loadFile(path.join(__dirname, "..", "dist", "index.html"), { hash: "/" });
    }

    // Hide on close instead of destroying window so overlay stays active
    controlWin.on("close", (e) => {
        if (!app.isQuitting) {
            e.preventDefault();
            controlWin.hide();
        }
    });
}

function toggleVisibility() {
    currentState.enabled = !currentState.enabled;
    broadcastState(currentState);
}

function createTray() {
    tray = new Tray(createTrayIcon());
    tray.setToolTip("Aman Dangle Overlay");
    tray.setContextMenu(
        Menu.buildFromTemplate([
            { label: "Open Control Panel", click: showControlWindow },
            { label: "Toggle Visible / Invisible", click: toggleVisibility },
            { type: "separator" },
            { label: "Reset Position", click: resetPosition },
            { type: "separator" },
            {
                label: "Quit Aman Dangle",
                click: () => {
                    app.isQuitting = true;
                    app.quit();
                },
            },
        ])
    );

    tray.on("double-click", showControlWindow);
}

function registerIpc() {
    ipcMain.on("overlay:set-interactive", (_event, active) => {
        if (win && !win.isDestroyed()) {
            win.setIgnoreMouseEvents(!active, { forward: true });
        }
    });

    ipcMain.on("overlay:send-state", (_event, state) => {
        currentState = { ...currentState, ...state };
        broadcastState(currentState);
    });

    ipcMain.on("overlay:open-control-web", () => {
        showControlWindow();
    });

    ipcMain.on("overlay:quit", () => {
        app.isQuitting = true;
        app.quit();
    });
}

app.disableHardwareAcceleration();

app.whenReady().then(() => {
    registerIpc();
    createOverlayWindow();
    showControlWindow();
    createTray();
    startControlServer();
});

app.on("window-all-closed", (e) => {
    // Keep app running in tray background
    e.preventDefault();
});
