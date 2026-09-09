import React from "react";
import { CHARMS, CharmId } from "@/lib/charms";
import { useHearth } from "@/store/hearth";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function ControlPanel() {
    const enabled = useHearth((s) => s.enabled);
    const position = useHearth((s) => s.position);
    const threadLength = useHearth((s) => s.threadLength);
    const charmId = useHearth((s) => s.charmId);
    const idleSpeed = useHearth((s) => s.idleSpeed ?? 50);
    const hoverSpeed = useHearth((s) => s.hoverSpeed ?? 50);
    const setEnabled = useHearth((s) => s.setEnabled);
    const setPosition = useHearth((s) => s.setPosition);
    const setThreadLength = useHearth((s) => s.setThreadLength);
    const setIdleSpeed = useHearth((s) => s.setIdleSpeed);
    const setHoverSpeed = useHearth((s) => s.setHoverSpeed);
    const setCharmId = useHearth((s) => s.setCharmId);
    const flick = useHearth((s) => s.flick);

    return (
        <div className="flex w-full flex-col gap-6 py-4">
            {/* Top Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-800 bg-[#0e121a] p-4 text-white shadow-xl">
                <div className="flex items-center gap-3 min-w-[140px]">
                    <Switch id="hang-toggle" checked={enabled} onCheckedChange={setEnabled} />
                    <Label htmlFor="hang-toggle" className="cursor-pointer text-sm font-medium text-neutral-300">
                        {enabled ? "Visible on Screen" : "Hidden"}
                    </Label>
                </div>

                <div className="flex flex-1 items-center gap-3 min-w-[180px]">
                    <Label className="text-xs text-neutral-400">Position</Label>
                    <Slider min={8} max={92} step={1} value={[position]} onValueChange={(v) => setPosition(v[0] ?? 50)} />
                    <span className="text-xs text-neutral-400 tabular-nums">{Math.round(position)}%</span>
                </div>

                <div className="flex flex-1 items-center gap-3 min-w-[180px]">
                    <Label className="text-xs text-neutral-400">Thread</Label>
                    <Slider
                        min={40}
                        max={700}
                        step={1}
                        value={[threadLength]}
                        onValueChange={(v) => setThreadLength(v[0] ?? 140)}
                    />
                    <span className="text-xs text-neutral-400 tabular-nums">{Math.round(threadLength)}px</span>
                </div>

                <div className="flex flex-1 items-center gap-3 min-w-[180px]">
                    <Label className="text-xs text-neutral-400">Normal Swing</Label>
                    <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[idleSpeed]}
                        onValueChange={(v) => setIdleSpeed(v[0] ?? 50)}
                    />
                    <span className="text-xs text-neutral-400 tabular-nums">{Math.round(idleSpeed)}%</span>
                </div>

                <div className="flex flex-1 items-center gap-3 min-w-[180px]">
                    <Label className="text-xs text-neutral-400">Hover Swing</Label>
                    <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[hoverSpeed]}
                        onValueChange={(v) => setHoverSpeed(v[0] ?? 50)}
                    />
                    <span className="text-xs text-neutral-400 tabular-nums">{Math.round(hoverSpeed)}%</span>
                </div>
            </div>

            {/* Header section */}
            <div className="space-y-1">
                <h2 className="font-serif text-3xl font-medium tracking-tight text-amber-100">Choose your charm</h2>
                <p className="text-sm text-neutral-400">
                    Each one comes from a tradition around the world, with a small ritual of its own. Pick a charm to hang it on this page.
                </p>
            </div>

            {/* 3-Column Card Grid using PNG Images */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {CHARMS.map((c) => {
                    const isActive = c.id === charmId;
                    return (
                        <div
                            key={c.id}
                            onClick={() => setCharmId(c.id as CharmId)}
                            className={`group relative flex cursor-pointer select-none flex-col justify-between rounded-2xl border bg-[#0b0e14] p-6 text-center transition-all duration-200 hover:scale-[1.02] ${isActive
                                    ? "border-blue-500 bg-[#0e131d] shadow-[0_0_24px_rgba(59,130,246,0.2)] ring-1 ring-blue-500"
                                    : "border-neutral-800/80 hover:border-neutral-700"
                                }`}
                        >
                            {/* Charm Image Preview */}
                            <div className="relative mb-5 flex h-40 w-full pointer-events-none items-center justify-center">
                                <div className="absolute top-0 h-10 w-[2px] bg-amber-600/70" />
                                <img
                                    src={c.previewImage}
                                    alt={c.name}
                                    className="max-h-32 max-w-[120px] object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:-translate-y-1"
                                />
                            </div>

                            {/* Name & Origin */}
                            <div className="space-y-1 pointer-events-none">
                                <h3 className="font-serif text-xl font-medium text-amber-50">{c.name}</h3>
                                <p className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">{c.origin}</p>
                            </div>

                            {/* Description */}
                            <p className="my-4 text-xs leading-relaxed text-neutral-400 pointer-events-none">{c.description}</p>

                            {/* Action Button */}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCharmId(c.id as CharmId);
                                    flick();
                                }}
                                className={`w-full cursor-pointer rounded-xl border py-2.5 text-xs font-medium transition-colors ${isActive
                                        ? "border-blue-500/80 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20"
                                        : "border-neutral-700 bg-neutral-800/40 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800"
                                    }`}
                            >
                                {c.actionLabel}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}