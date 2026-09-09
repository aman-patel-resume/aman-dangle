import { useEffect } from "react";
import { ControlPanel } from "@/components/control-panel";
import { useHearth } from "@/store/hearth";

export function HomePage() {
    useEffect(() => {
        void useHearth.persist.rehydrate();
    }, []);

    return (
        <main className="min-h-screen bg-[#06080c] px-4 py-6 text-neutral-100 md:px-8">
            <div className="mx-auto flex max-w-5xl flex-col gap-6">
                {/* Header Title */}
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
                    <div>
                        <h1 className="font-serif text-2xl font-semibold text-amber-100">Lucky Dangle Control Dashboard</h1>
                        <p className="text-xs text-neutral-400 mt-1">Live controls synchronized with your desktop overlay screen</p>
                    </div>
                </div>

                {/* Gallery Cards & Controls Section */}
                <ControlPanel />
            </div>
        </main>
    );
}