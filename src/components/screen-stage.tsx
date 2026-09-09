import { HangingCharm } from "@/components/hanging-charm";
import { useHearth } from "@/store/hearth";

export function ScreenStage() {
    const enabled = useHearth((s) => s.enabled);
    const position = useHearth((s) => s.position);
    const threadLength = useHearth((s) => s.threadLength);
    const charmId = useHearth((s) => s.charmId);
    const flickToken = useHearth((s) => s.flickToken);

    return (
        <section
            className="relative h-[440px] w-full overflow-hidden rounded-2xl border border-neutral-800 bg-[#0a0d14] shadow-2xl"
            aria-label="Live charm preview"
        >
            {/* Background Stage Card Decorators */}
            <div className="pointer-events-none absolute inset-4 rounded-xl border border-neutral-800/60 bg-[#07090e]/70 shadow-[inset_0_0_80px_rgba(0,0,0,0.5)]">
                <div className="absolute left-4 top-4 h-2 w-16 rounded-full bg-neutral-800" />
                <div className="absolute left-4 top-8 h-2 w-28 rounded-full bg-neutral-800/60" />
            </div>

            <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-xs text-neutral-500 select-none">
                {enabled ? "Grab the charm — it stays tied and swings" : "Charm is hidden"}
            </p>

            {/* Hanging Charm Canvas */}
            {enabled && (
                <div className="relative h-full w-full">
                    <HangingCharm
                        charmId={charmId}
                        enabled={enabled}
                        position={position}
                        threadLength={threadLength}
                        flickToken={flickToken}
                    />
                </div>
            )}
        </section>
    );
}