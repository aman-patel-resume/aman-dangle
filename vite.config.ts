import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
// If your app uses TanStack Start, re-add its plugin here, e.g.:
//   import { tanstackStart } from "@tanstack/react-start/plugin/vite";
// If you use the standalone TanStack Router plugin:
//   import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
    // plugins: [tanstackStart(), react()],   <-- keep your original plugins line
    plugins: [tailwindcss(), react()],

    base: "./",

    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "src"),
        },
    },

    server: {
        host: "0.0.0.0",
        port: 8080,
        allowedHosts: true,
        // Stop Vite from watching Visual Studio's cache (fixes the EBUSY crash).
        watch: {
            ignored: [
                "**/.vs/**",
                "**/node_modules/**",
                "**/dist/**",
                "**/release/**",
                "**/.output/**",
            ],
        },
    },

    preview: {
        host: "0.0.0.0",
        port: 8080,
        allowedHosts: true,
    },
});
