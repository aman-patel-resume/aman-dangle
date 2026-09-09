import { createRouter, createHashHistory } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
    const isFileProtocol = typeof window !== "undefined" && window.location.protocol === "file:";
    return createRouter({
        routeTree,
        history: isFileProtocol ? createHashHistory() : undefined,
        defaultErrorComponent: AppErrorComponent,
    });
}
