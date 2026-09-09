// fix-encoding.cjs - re-encode project files as UTF-8 (no BOM, LF endings).
// Run from your project root:  node fix-encoding.cjs
//
// Fixes the "stream did not contain valid UTF-8" build error that happens
// when a file gets saved as UTF-16 (or with a BOM / bad bytes) on Windows.

const fs = require("fs");
const path = require("path");

const FILES = [
  "index.html",
  "demo.html",
  "electron/main.cjs",
  "electron/preload.cjs",
  "vite.config.ts",
  "package.json",
  "src/routes/overlay.tsx",
  "src/overlay/global.d.ts",
];

for (const f of FILES) {
  if (!fs.existsSync(f)) continue;
  const b = fs.readFileSync(f);
  let s;
  if (b.length >= 2 && b[0] === 0xff && b[1] === 0xfe) {
    s = b.toString("utf16le"); // UTF-16 LE
  } else if (b.length >= 2 && b[0] === 0xfe && b[1] === 0xff) {
    s = Buffer.from(b).swap16().toString("utf16le"); // UTF-16 BE
  } else {
    s = b.toString("utf8");
  }
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1); // strip BOM
  fs.writeFileSync(f, s.replace(/\r\n/g, "\n"), "utf8");
  console.log("converted", path.resolve(f), "-> UTF-8");
}
console.log("done");
