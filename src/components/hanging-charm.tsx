"use client";

import React, { useEffect, useRef } from "react";
import { CHARMS, CharmConfig, StackPiece } from "@/lib/charms";

/* ==================================================================== */
/*  HangingCharm — Verlet rope physics                                 */
/* ==================================================================== */

export interface HangingCharmProps {
    xPercent?: number;
    position?: number;
    threadLength?: number;
    idleSpeed?: number;
    hoverSpeed?: number;
    charmId?: string;
    charmType?: string;
    enabled?: boolean;
    interactive?: boolean;
    flickToken?: number;
    onFlickTrigger?: boolean;
    onInteractionChange?: (active: boolean) => void;
}

interface PhysicsNode {
    x: number; y: number;
    oldX: number; oldY: number;
}

interface MountedPiece {
    part: StackPiece;
    nodeIndex: number;
    anchorTop: boolean;
}

interface ChainLayout {
    dists: number[];
    pieces: MountedPiece[];
    eyeletDepth: number;
}

/* ==================================================================== */
/*  Physics Constants                                                   */
/* ==================================================================== */

const NUM_UPPER = 14;
const SOLVER_ITERS = 16;
/** Gravity px/frame² at 60 Hz */
const GRAVITY = 0.9;
/** Per-frame velocity retention — 0.955 settles swing in ~2-3 s */
const DAMPING = 0.955;
const FRAME_MS = 1000 / 60;
const PICK_CORD = 28;
const HOVER_RADIUS = 100;
/** Frames after drag/hover before vy is suppressed to kill vertical bounce */
const SETTLE_FRAMES = 80;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/* ==================================================================== */
/*  Chain layout builder                                                */
/* ==================================================================== */

function pieceHalfExtent(part: StackPiece, isLast: boolean, isNimbu: boolean): number {
    if (part.type && part.type.startsWith("bead")) return part.width / 2;
    if (part.src) {
        if (isNimbu) return part.height / 2;
        if (!isLast) return part.height / 2;
        return 0;
    }
    return Math.max(part.width, part.height) / 2;
}

function buildLayout(charm: CharmConfig, threadLength: number, originX: number): ChainLayout {
    const nodes: PhysicsNode[] = [];
    const dists: number[] = [];
    const pieces: MountedPiece[] = [];

    const segLen = threadLength / NUM_UPPER;
    for (let i = 0; i <= NUM_UPPER; i++) {
        const y = i * segLen;
        nodes.push({ x: originX, y, oldX: originX, oldY: y });
        if (i > 0) dists.push(segLen);
    }

    const baseY = threadLength;
    const stack = charm.stack;
    const isNimbu = charm.id === "nimbu-mirchi";
    let cursorY = baseY;
    let pendantAnchorOffset = 0;

    for (let i = 0; i < stack.length; i++) {
        const part = stack[i];
        const isLast = i === stack.length - 1;
        let step: number;

        if (isNimbu) {
            if (i === 0) {
                step = pieceHalfExtent(part, isLast, true);
            } else if (isLast) {
                step = pieceHalfExtent(stack[i - 1], false, true) + pieceHalfExtent(part, true, true);
            } else {
                step = Math.max(6, part.offsetY - stack[i - 1].offsetY);
            }
        } else if (i === 0) {
            step = pieceHalfExtent(part, isLast, false);
            if (step <= 0) step = clamp(charm.threadThroughLength, 2, 8);
        } else {
            step = pieceHalfExtent(stack[i - 1], false, false) + pieceHalfExtent(part, isLast, false);
        }

        cursorY += step;
        nodes.push({ x: originX, y: cursorY, oldX: originX, oldY: cursorY });
        dists.push(step);
        const anchorTop = !isNimbu && isLast && Boolean(part.src);
        if (anchorTop) pendantAnchorOffset = cursorY - baseY;
        pieces.push({ part, nodeIndex: nodes.length - 1, anchorTop });
    }

    const eyeletDepth =
        isNimbu || pendantAnchorOffset === 0
            ? 0
            : clamp(charm.threadThroughLength - pendantAnchorOffset, 0, 30);

    return { dists, pieces, eyeletDepth };
}

/* ==================================================================== */
/*  Procedural bead shaders                                            */
/* ==================================================================== */

type BeadType = Exclude<NonNullable<StackPiece["type"]>, "image">;

function drawBead(ctx: CanvasRenderingContext2D, type: BeadType, r: number): void {
    const sphere = (stops: Array<[number, string]>) => {
        const g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
        for (const [o, c] of stops) g.addColorStop(o, c);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    };
    const glint = () => {
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.beginPath(); ctx.arc(-r * 0.32, -r * 0.32, r * 0.18, 0, Math.PI * 2); ctx.fill();
    };
    switch (type) {
        case "bead-white":    sphere([[0,"#ffffff"],[0.6,"#e2e8f0"],[1,"#94a3b8"]]); break;
        case "bead-gold":     sphere([[0,"#fef9c3"],[0.5,"#eab308"],[1,"#854d0e"]]); break;
        case "bead-blue":     sphere([[0,"#bfdbfe"],[0.55,"#2563eb"],[1,"#1e3a8a"]]); break;
        case "bead-red":      sphere([[0,"#fecaca"],[0.55,"#dc2626"],[1,"#7f1d1d"]]); break;
        case "bead-turquoise":sphere([[0,"#99f6e4"],[0.55,"#0d9488"],[1,"#115e59"]]); break;
        case "bead-mini-eye": {
            sphere([[0,"#3b82f6"],[1,"#1e40af"]]);
            ctx.fillStyle="#ffffff"; ctx.beginPath(); ctx.arc(0,0,r*0.68,0,Math.PI*2); ctx.fill();
            ctx.fillStyle="#7dd3fc"; ctx.beginPath(); ctx.arc(0,0,r*0.45,0,Math.PI*2); ctx.fill();
            ctx.fillStyle="#0f172a"; ctx.beginPath(); ctx.arc(0,0,r*0.24,0,Math.PI*2); ctx.fill();
            break;
        }
        case "bead-mini-clover": {
            ctx.fillStyle="#10b981";
            for (let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2);ctx.beginPath();ctx.arc(0,-r*0.55,r*0.5,0,Math.PI*2);ctx.fill();ctx.restore();}
            ctx.fillStyle="#047857"; ctx.beginPath(); ctx.arc(0,0,r*0.16,0,Math.PI*2); ctx.fill();
            break;
        }
    }
    glint();
}

/* ==================================================================== */
/*  Graceful asset fallback                                            */
/* ==================================================================== */

function drawPlaceholder(ctx: CanvasRenderingContext2D, src: string, w: number, h: number, anchorTop: boolean): void {
    const rr = (x: number, y: number, rw: number, rh: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x+r,y); ctx.arcTo(x+rw,y,x+rw,y+rh,r);
        ctx.arcTo(x+rw,y+rh,x,y+rh,r); ctx.arcTo(x,y+rh,x,y,r);
        ctx.arcTo(x,y,x+rw,y,r); ctx.closePath();
    };
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 5;
    if (src.includes("chili")) {
        const g = ctx.createLinearGradient(0,-h/2,0,h/2);
        g.addColorStop(0,"#b91c1c"); g.addColorStop(0.5,"#ef4444"); g.addColorStop(1,"#7f1d1d");
        ctx.fillStyle=g; rr(-w/2,-h/2,w,h,h/2); ctx.fill();
        ctx.fillStyle="#16a34a"; ctx.fillRect(-1.5,-h/2-4,3,6);
    } else if (src.includes("lemon")) {
        const g = ctx.createRadialGradient(-w*0.15,-h*0.2,w*0.1,0,0,w/2);
        g.addColorStop(0,"#fef9c3"); g.addColorStop(0.6,"#facc15"); g.addColorStop(1,"#a16207");
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,w/2,0,Math.PI*2); ctx.fill();
        ctx.fillStyle="#65a30d"; ctx.fillRect(-2,-h/2-3,4,6);
    } else if (src.includes("coal")) {
        const g = ctx.createRadialGradient(-w*0.2,-h*0.2,w*0.15,0,0,w/2);
        g.addColorStop(0,"#4b5563"); g.addColorStop(1,"#111827");
        ctx.fillStyle=g; ctx.beginPath();
        ctx.moveTo(-w/2,h*0.1); ctx.quadraticCurveTo(-w*0.3,-h*0.6,0,-h*0.45);
        ctx.quadraticCurveTo(w*0.35,-h*0.7,w/2,-h*0.05); ctx.quadraticCurveTo(w*0.3,h*0.5,0,h*0.4);
        ctx.quadraticCurveTo(-w*0.3,h*0.6,-w/2,h*0.1); ctx.fill();
    } else if (anchorTop) {
        const ringR = Math.min(w,h)*0.16;
        ctx.strokeStyle="#d4af37"; ctx.lineWidth=Math.max(2,w*0.05);
        ctx.beginPath(); ctx.arc(0,ringR*0.7,ringR,0,Math.PI*2); ctx.stroke();
        const g = ctx.createLinearGradient(0,ringR*1.4,0,h);
        g.addColorStop(0,"#3b4252"); g.addColorStop(1,"#1c2230");
        ctx.fillStyle=g; rr(-w/2,ringR*1.4,w,h-ringR*1.4,Math.min(12,w*0.2)); ctx.fill();
        ctx.strokeStyle="rgba(255,255,255,0.08)"; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(-w*0.2,h*0.5); ctx.lineTo(w*0.2,h*0.5); ctx.stroke();
    } else {
        const g = ctx.createRadialGradient(-w*0.15,-h*0.2,w*0.1,0,0,Math.max(w,h)/2);
        g.addColorStop(0,"#94a3b8"); g.addColorStop(1,"#334155");
        ctx.fillStyle=g; rr(-w/2,-h/2,w,h,Math.min(w,h)*0.3); ctx.fill();
    }
    ctx.restore();
}

/* ==================================================================== */
/*  Cord + ceiling mount                                               */
/* ==================================================================== */

function drawCord(ctx: CanvasRenderingContext2D, nodes: PhysicsNode[], end: number): void {
    if (end < 1) return;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 3;
    ctx.strokeStyle = "#b9855a"; ctx.lineWidth = 2.2;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i < end; i++) {
        const xc = (nodes[i].x + nodes[i+1].x) / 2;
        const yc = (nodes[i].y + nodes[i+1].y) / 2;
        ctx.quadraticCurveTo(nodes[i].x, nodes[i].y, xc, yc);
    }
    ctx.lineTo(nodes[end].x, nodes[end].y);
    ctx.stroke(); ctx.restore();

    ctx.save(); ctx.fillStyle = "#6b4a2b";
    ctx.beginPath(); ctx.arc(nodes[0].x, 1.5, 3.2, 0, Math.PI*2); ctx.fill(); ctx.restore();
}

/* ==================================================================== */
/*  Component                                                          */
/* ==================================================================== */

export const HangingCharm: React.FC<HangingCharmProps> = ({
    xPercent, position = 50, threadLength = 130,
    idleSpeed = 50, hoverSpeed = 50,
    charmId, charmType, enabled = true, interactive = true,
    flickToken, onFlickTrigger, onInteractionChange,
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

    const activePosition = Number.isFinite(xPercent) ? Number(xPercent) : Number.isFinite(position) ? Number(position) : 50;
    const activeLength = clamp(Number.isFinite(threadLength) ? Number(threadLength) : 130, 50, 300);
    const activeCharmId = (charmId ?? charmType ?? "ghanta").toLowerCase();
    const currentCharm = (CHARMS.find((c) => c.id === activeCharmId) ?? CHARMS[0]) as CharmConfig;

    const stateRef = useRef({ position: activePosition, threadLength: activeLength, idleSpeed, hoverSpeed, charm: currentCharm, enabled, interactive });
    useEffect(() => {
        stateRef.current = { position: activePosition, threadLength: activeLength, idleSpeed, hoverSpeed, charm: currentCharm, enabled, interactive };
    }, [activePosition, activeLength, idleSpeed, hoverSpeed, currentCharm, enabled, interactive]);

    const nodesRef = useRef<PhysicsNode[]>([]);
    const layoutRef = useRef<ChainLayout>({ dists: [], pieces: [], eyeletDepth: 0 });
    const builtKeyRef = useRef<string>("");
    const lastOriginXRef = useRef<number | null>(null);

    // drag: node index + offsets so the grab point feels natural
    const dragRef = useRef({ active: false, node: -1, offsetX: 0, offsetY: 0 });
    const pointerRef = useRef({ x: 0, y: 0 });
    // flick momentum ring buffer
    const historyRef = useRef<Array<{ x: number; y: number; t: number }>>([]);

    // frames since last drag/hover interaction — gates idle vy suppression
    const settleRef = useRef(9999);
    // hover cooldown to prevent continuous energy injection
    const hoverCooldownRef = useRef(0);
    const prevMouseXRef = useRef<number | null>(null);

    const spinRef = useRef(0);
    const spinVelRef = useRef(0);
    const prevFlickRef = useRef<number | boolean | undefined>(flickToken ?? onFlickTrigger);

    const onInteractionRef = useRef(onInteractionChange);
    useEffect(() => { onInteractionRef.current = onInteractionChange; }, [onInteractionChange]);
    const overCharmRef = useRef(false);
    // debounce setOver to stop IPC flicker when charm edge sweeps hit-test boundary
    const overDebounceRef = useRef<{ val: boolean; frames: number }>({ val: false, frames: 0 });

    /* ---- Preload sprites ---- */
    useEffect(() => {
        for (const charm of CHARMS)
            for (const part of charm.stack)
                if (part.src && !imageCache.current.has(part.src)) {
                    const img = new Image(); img.decoding = "async"; img.src = part.src;
                    imageCache.current.set(part.src, img);
                }
    }, []);

    /* ---- External flick ---- */
    useEffect(() => {
        const cur = flickToken ?? onFlickTrigger;
        if (cur === undefined || cur === prevFlickRef.current) return;
        prevFlickRef.current = cur;
        const dir = Math.random() < 0.5 ? -1 : 1;
        const nodes = nodesRef.current;
        const bottom = nodes[nodes.length - 1];
        if (bottom) { bottom.oldX = bottom.x + dir * 8; bottom.oldY = bottom.y; }
        settleRef.current = 0;
    }, [flickToken, onFlickTrigger]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let raf = 0;
        let lastTime = performance.now();

        const setOver = (over: boolean) => {
            const db = overDebounceRef.current;
            if (over !== db.val) { db.val = over; db.frames = 0; return; }
            db.frames++;
            if (db.frames >= 3 && over !== overCharmRef.current) {
                overCharmRef.current = over;
                onInteractionRef.current?.(over);
            }
        };

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const w = canvas.parentElement?.clientWidth || window.innerWidth;
            const h = canvas.parentElement?.clientHeight || window.innerHeight;
            canvas.width = w * dpr; canvas.height = h * dpr;
            canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
        };

        const build = () => {
            const state = stateRef.current;
            const dpr = window.devicePixelRatio || 1;
            const w = (canvas.width / dpr) || window.innerWidth;
            const ox = (w * state.position) / 100;
            const layout = buildLayout(state.charm, state.threadLength, ox);
            layoutRef.current = layout;
            // rebuild nodes from layout segments
            const ns: PhysicsNode[] = [{ x: ox, y: 0, oldX: ox, oldY: 0 }];
            let sy = 0;
            for (const d of layout.dists) { sy += d; ns.push({ x: ox, y: sy, oldX: ox, oldY: sy }); }
            nodesRef.current = ns;
            builtKeyRef.current = `${state.charm.id}:${state.threadLength}`;
            lastOriginXRef.current = ox;
            dragRef.current = { active: false, node: -1, offsetX: 0, offsetY: 0 };
            settleRef.current = 9999;
        };

        resize(); build();

        const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
        if (ro && canvas.parentElement) ro.observe(canvas.parentElement);
        window.addEventListener("resize", resize);

        /* ================================================================ */
        /*  Render + physics loop                                           */
        /* ================================================================ */
        const render = (now: number) => {
            const dpr = window.devicePixelRatio || 1;
            const width = canvas.width / dpr;
            const state = stateRef.current;
            const originX = (width * state.position) / 100;
            const originY = 0;

            // Rebuild if charm or length changed
            const key = `${state.charm.id}:${state.threadLength}`;
            if (key !== builtKeyRef.current) build();

            // Shift whole chain when position slider moves
            if (lastOriginXRef.current !== null && Math.abs(originX - lastOriginXRef.current) > 0.1) {
                const dx = originX - lastOriginXRef.current;
                for (const n of nodesRef.current) { n.x += dx; n.oldX += dx; }
                lastOriginXRef.current = originX;
            }

            const nodes = nodesRef.current;
            const { dists, pieces, eyeletDepth } = layoutRef.current;
            const k = clamp((now - lastTime) / FRAME_MS, 0.25, 2.5);
            lastTime = now;

            // Advance settle counter
            if (!dragRef.current.active && settleRef.current < 9999) settleRef.current++;
            // Advance hover cooldown
            if (hoverCooldownRef.current > 0) hoverCooldownRef.current--;

            ctx.setTransform(1,0,0,1,0,0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.setTransform(dpr,0,0,dpr,0,0);

            if (!state.enabled || nodes.length === 0) {
                if (overCharmRef.current) setOver(false);
                raf = requestAnimationFrame(render); return;
            }

            /* ---- Pin anchor ---- */
            nodes[0].x = originX; nodes[0].y = originY;
            nodes[0].oldX = originX; nodes[0].oldY = originY;

            /* ---- Verlet integrate ---- */
            const damp = Math.pow(DAMPING, k);
            const g = GRAVITY * k * k;
            const idleMult = (state.idleSpeed ?? 50) / 50;
            const nowSec = now * 0.001;
            const settled = settleRef.current >= SETTLE_FRAMES;

            for (let i = 1; i < nodes.length; i++) {
                const n = nodes[i];

                if (dragRef.current.active && i === dragRef.current.node) {
                    const tx = pointerRef.current.x + dragRef.current.offsetX;
                    const ty = pointerRef.current.y + dragRef.current.offsetY;
                    // Clamp: rope can stretch max 10% beyond rest length
                    const totalRest = dists.reduce((s, d) => s + d, 0);
                    const maxLen = totalRest * 1.10;
                    const dr = Math.hypot(tx - originX, ty - originY);
                    let fx = tx, fy = ty;
                    if (dr > maxLen) { const sc = maxLen / dr; fx = originX + (tx - originX) * sc; fy = originY + (ty - originY) * sc; }
                    const lerp = 1 - Math.pow(0.5, k);
                    n.x += (fx - n.x) * lerp; n.y += (fy - n.y) * lerp;
                    n.oldX = n.x; n.oldY = n.y;
                    continue;
                }

                const vx = (n.x - n.oldX) * damp;
                // vy: full when unsettled (drop with mass), zeroed when idle (no vertical bounce)
                const rawVy = (n.y - n.oldY) * damp;
                const vy = settled ? 0 : rawVy;

                n.oldX = n.x; n.oldY = n.y;

                // Uniform idle sway (NO per-node phase to avoid constraint-induced vertical jitter)
                const factor = i / nodes.length;
                const idleSway = idleMult > 0.02
                    ? Math.sin(nowSec * idleMult) * 0.03 * idleMult * factor * k
                    : 0;

                n.x += vx + idleSway;
                n.y += vy + g;
            }

            /* ---- Distance constraints (inextensible + 10% elastic stretch while dragging) ---- */
            const isDragging = dragRef.current.active;
            const maxStretch = isDragging ? 1.10 : 1.0;
            const compliance = isDragging ? 0.4 : 0.85;

            for (let iter = 0; iter < SOLVER_ITERS; iter++) {
                for (let i = 0; i < dists.length; i++) {
                    const a = nodes[i], b = nodes[i+1];
                    const dx = b.x - a.x, dy = b.y - a.y;
                    const dist = Math.hypot(dx, dy) || 1e-4;
                    const rest = dists[i];
                    const maxRest = rest * maxStretch;
                    let target = rest;
                    if (dist > maxRest) { target = maxRest; }
                    else if (isDragging && dist > rest) { target = rest + (dist - rest) * (1 - compliance); }
                    const diff = ((dist - target) / dist) * compliance;

                    const aDrag = isDragging && i === dragRef.current.node;
                    const bDrag = isDragging && i+1 === dragRef.current.node;

                    if (i === 0) {
                        if (!bDrag) { b.x -= dx*diff; b.y -= dy*diff; }
                    } else if (aDrag) {
                        b.x -= dx*diff; b.y -= dy*diff;
                    } else if (bDrag) {
                        a.x += dx*diff; a.y += dy*diff;
                    } else {
                        a.x += dx*diff*0.5; a.y += dy*diff*0.5;
                        b.x -= dx*diff*0.5; b.y -= dy*diff*0.5;
                    }
                }
                nodes[0].x = originX; nodes[0].y = originY;
            }

            /* ---- 3D spin from lateral motion of bottom node ---- */
            const bot = nodes[nodes.length - 1];
            const lateralV = bot.x - bot.oldX;
            spinVelRef.current = (spinVelRef.current + lateralV * 0.005) * 0.88;
            spinVelRef.current = clamp(spinVelRef.current, -0.18, 0.18);
            spinRef.current += spinVelRef.current;

            /* ---- Draw cord ---- */
            drawCord(ctx, nodes, nodes.length - 1);

            /* ---- Eyelet extension ---- */
            if (eyeletDepth > 0 && pieces.length > 0) {
                const lp = pieces[pieces.length - 1];
                if (lp?.anchorTop) {
                    const anchor = nodes[lp.nodeIndex];
                    const prev = nodes[Math.max(0, lp.nodeIndex - 1)];
                    let tx = anchor.x - prev.x, ty = anchor.y - prev.y;
                    const tl = Math.hypot(tx, ty) || 1;
                    tx /= tl; ty /= tl;
                    ctx.save(); ctx.strokeStyle = "#b9855a"; ctx.lineWidth = 2.2; ctx.lineCap = "round";
                    ctx.beginPath(); ctx.moveTo(anchor.x, anchor.y);
                    ctx.lineTo(anchor.x + tx * eyeletDepth, anchor.y + ty * eyeletDepth);
                    ctx.stroke(); ctx.restore();
                }
            }

            /* ---- Draw pieces ---- */
            for (const mounted of pieces) {
                const idx = mounted.nodeIndex;
                const node = nodes[Math.min(idx, nodes.length - 1)];
                const prev = nodes[Math.max(0, idx - 1)];
                const next = nodes[Math.min(nodes.length - 1, idx + 1)];
                const segAngle = Math.atan2(next.x - prev.x, next.y - prev.y);

                ctx.save();
                ctx.translate(node.x, node.y);
                ctx.rotate(-segAngle);

                const part = mounted.part;
                if (part.type && part.type.startsWith("bead")) {
                    ctx.shadowColor = "rgba(0,0,0,0.25)"; ctx.shadowBlur = 4; ctx.shadowOffsetY = 2;
                    drawBead(ctx, part.type as BeadType, part.width / 2);
                    ctx.restore(); continue;
                }

                const img = part.src ? imageCache.current.get(part.src) : undefined;
                const w = part.width, h = part.height;

                if (part.src && part.src.includes("chili")) {
                    const t = spinRef.current + (part.spinPhase ?? 0);
                    ctx.translate(Math.sin(t)*1.5, 0);
                    ctx.rotate(Math.sin(t)*0.05);
                    ctx.scale(0.82 + 0.18*Math.cos(t), 1);
                }

                if (img && img.complete && img.naturalWidth > 0) {
                    ctx.save();
                    ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 10;
                    ctx.shadowOffsetX = Math.sin(-segAngle)*4; ctx.shadowOffsetY = 6;
                    ctx.drawImage(img, -w/2, mounted.anchorTop ? -2 : -h/2, w, h);
                    ctx.restore();
                } else {
                    if (mounted.anchorTop) ctx.translate(0, -2);
                    drawPlaceholder(ctx, part.src ?? "", w, h, mounted.anchorTop);
                }
                ctx.restore();
            }

            raf = requestAnimationFrame(render);
        };
        raf = requestAnimationFrame(render);

        /* ================================================================ */
        /*  Input handlers                                                  */
        /* ================================================================ */
        const getPos = (e: MouseEvent | TouchEvent) => {
            const rect = canvas.getBoundingClientRect();
            const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
            const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
            return { x: cx - rect.left, y: cy - rect.top };
        };

        const pickNodeAt = (pos: { x: number; y: number }): number => {
            const nodes = nodesRef.current;
            if (nodes.length < 2) return -1;
            const { pieces } = layoutRef.current;
            const lastPart = stateRef.current.charm.stack[stateRef.current.charm.stack.length - 1];
            for (const m of pieces) {
                const n = nodes[m.nodeIndex];
                const half = m.part.type?.startsWith("bead") ? m.part.width / 2 : Math.max(m.part.width, m.part.height) / 2;
                const r = Math.max(14, half);
                const cy = m.anchorTop && m.part === lastPart ? n.y + m.part.height / 2 : n.y;
                if (Math.abs(pos.x - n.x) <= r && Math.abs(pos.y - cy) <= r) return m.nodeIndex;
            }
            let best = -1, bestD = PICK_CORD;
            for (let i = 1; i < nodes.length; i++) {
                const d = Math.hypot(pos.x - nodes[i].x, pos.y - nodes[i].y);
                if (d < bestD) { bestD = d; best = i; }
            }
            return best;
        };

        const releaseDrag = () => {
            const d = dragRef.current;
            if (!d.active) return;
            const n = nodesRef.current[d.node];
            if (n) {
                const h = historyRef.current;
                if (h.length >= 2) {
                    const a = h[h.length - 2], b = h[h.length - 1];
                    const dt = Math.max(b.t - a.t, 1);
                    let vx = (b.x - a.x) / dt * FRAME_MS;
                    let vy = (b.y - a.y) / dt * FRAME_MS;
                    const sp = Math.hypot(vx, vy);
                    if (sp > 60) { vx *= 60/sp; vy *= 60/sp; }
                    n.oldX = n.x - vx; n.oldY = n.y - vy;
                }
            }
            dragRef.current.active = false;
            historyRef.current = [];
            settleRef.current = 0; // countdown: full physics for SETTLE_FRAMES frames then idle
        };

        const onDown = (e: MouseEvent | TouchEvent) => {
            const state = stateRef.current;
            if (!state.enabled || !state.interactive) return;
            const pos = getPos(e);
            const best = pickNodeAt(pos);
            if (best === -1) return;
            if ("touches" in e) e.preventDefault();
            const n = nodesRef.current[best];
            dragRef.current = { active: true, node: best, offsetX: n.x - pos.x, offsetY: n.y - pos.y };
            pointerRef.current = pos;
            historyRef.current = [{ x: pos.x, y: pos.y, t: performance.now() }];
            settleRef.current = 0;
            setOver(true);
        };

        const onMove = (e: MouseEvent | TouchEvent) => {
            const pos = getPos(e);
            if (dragRef.current.active) {
                pointerRef.current = pos;
                const h = historyRef.current;
                h.push({ x: pos.x, y: pos.y, t: performance.now() });
                if (h.length > 6) h.shift();
                return;
            }
            if (!("touches" in e)) {
                // Debounced setOver — prevents rapid IPC toggling at hit-test edge
                setOver(pickNodeAt(pos) !== -1);

                // One-shot hover impulse with cooldown (no continuous energy)
                const dx = prevMouseXRef.current !== null ? pos.x - prevMouseXRef.current : 0;
                prevMouseXRef.current = pos.x;

                if (hoverCooldownRef.current <= 0 && Math.abs(dx) > 0.5) {
                    const nodes = nodesRef.current;
                    const hoverMult = (stateRef.current.hoverSpeed ?? 50) / 50;
                    for (let i = 1; i < nodes.length; i++) {
                        const n = nodes[i];
                        const d = Math.hypot(pos.x - n.x, pos.y - n.y);
                        if (d < HOVER_RADIUS) {
                            const strength = (1 - d / HOVER_RADIUS) * (i / nodes.length);
                            const impulse = clamp(dx * 0.006 * hoverMult, -0.8, 0.8) * strength;
                            n.oldX = n.x - impulse;
                        }
                    }
                    hoverCooldownRef.current = 40;
                    settleRef.current = 0;
                }
            }
        };

        const onUp = () => releaseDrag();
        const onLeave = () => {
            releaseDrag();
            prevMouseXRef.current = null;
            setOver(false);
        };

        window.addEventListener("mousedown", onDown);
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        window.addEventListener("touchstart", onDown, { passive: false });
        window.addEventListener("touchmove", onMove, { passive: false });
        window.addEventListener("touchend", onUp);
        window.addEventListener("touchcancel", onUp);
        window.addEventListener("mouseleave", onLeave);

        return () => {
            cancelAnimationFrame(raf);
            if (ro) ro.disconnect();
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousedown", onDown);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
            window.removeEventListener("touchstart", onDown);
            window.removeEventListener("touchmove", onMove);
            window.removeEventListener("touchend", onUp);
            window.removeEventListener("touchcancel", onUp);
            window.removeEventListener("mouseleave", onLeave);
        };
    }, []);

    return (
        <div className="relative h-full w-full min-h-[380px] overflow-hidden select-none">
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing" style={{ touchAction: "none" }} />
        </div>
    );
};
