export type CharmId =
    | "nazar"
    | "hamsa"
    | "nimbu-mirchi"
    | "ghanta"
    | "drishti-bommai"
    | "chinese-knot"
    | "daruma"
    | "maneki-neko"
    | "horseshoe"
    | "scarab"
    | "four-leaf"
    | "himmeli";

export interface StackPiece {
    src: string;
    width: number;
    height: number;
    offsetY: number;
    type?:
    | "bead-white"
    | "bead-mini-eye"
    | "bead-gold"
    | "bead-blue"
    | "bead-red"
    | "bead-turquoise"
    | "bead-mini-clover"
    | "image";
    spinPhase?: number;
}

export interface CharmConfig {
    id: CharmId;
    name: string;
    origin: string;
    description: string;
    actionLabel: string;
    previewImage: string;
    threadPassesThrough: boolean;
    threadThroughLength: number;
    anchorOffsetY: number;
    stack: StackPiece[];
}

export const CHARMS: CharmConfig[] = [
    {
        id: "nazar",
        name: "Nazar boncuğu",
        origin: "TURKEY AND THE MEDITERRANEAN",
        description: "A glass eye worn against the evil eye. Give it a flick when you want a little cover.",
        actionLabel: "Give it a flick",
        previewImage: "./charms/nazar.png",
        threadPassesThrough: true,
        threadThroughLength: 52,
        anchorOffsetY: 0,
        stack: [
            { src: "", width: 10, height: 10, offsetY: 0, type: "bead-white" },
            { src: "", width: 15, height: 15, offsetY: 12, type: "bead-mini-eye" },
            { src: "", width: 10, height: 10, offsetY: 28, type: "bead-white" },
            { src: "./charms/nazar.png", width: 84, height: 84, offsetY: 42, type: "image" },
        ],
    },
    {
        id: "hamsa",
        name: "Hamsa",
        origin: "MIDDLE EAST AND NORTH AFRICA",
        description: "An open hand carried for protection and good fortune. Give it a flick to send bad luck on its way.",
        actionLabel: "Give it a flick",
        previewImage: "./charms/hamsa.png",
        threadPassesThrough: true,
        threadThroughLength: 52,
        anchorOffsetY: 0,
        stack: [
            { src: "", width: 9, height: 9, offsetY: 0, type: "bead-gold" },
            { src: "", width: 14, height: 14, offsetY: 11, type: "bead-blue" },
            { src: "", width: 9, height: 9, offsetY: 27, type: "bead-gold" },
            { src: "./charms/hamsa.png", width: 72, height: 96, offsetY: 44, type: "image" },
        ],
    },
    {
        id: "maneki-neko",
        name: "Maneki-neko",
        origin: "JAPAN",
        description: "A beckoning cat that invites good fortune in. Call on it and watch its raised paw wave.",
        actionLabel: "Beckon good fortune",
        previewImage: "./charms/maneki-neko.png",
        threadPassesThrough: true,
        threadThroughLength: 52,
        anchorOffsetY: 0,
        stack: [
            { src: "", width: 9, height: 9, offsetY: 0, type: "bead-gold" },
            { src: "", width: 15, height: 15, offsetY: 11, type: "bead-red" },
            { src: "", width: 9, height: 9, offsetY: 28, type: "bead-gold" },
            { src: "./charms/maneki-neko.png", width: 66, height: 80, offsetY: 44, type: "image" },
        ],
    },
    {
        id: "ghanta",
        name: "Ghanta",
        origin: "INDIA",
        description: "A bell rung to clear the air and mark a beginning. Ring it when you make a wish, or before something that matters.",
        actionLabel: "Ring the bell",
        previewImage: "./charms/ghanta.png",
        threadPassesThrough: true,
        threadThroughLength: 52,
        anchorOffsetY: 0,
        stack: [
            { src: "", width: 9, height: 9, offsetY: 0, type: "bead-gold" },
            { src: "", width: 15, height: 15, offsetY: 11, type: "bead-red" },
            { src: "", width: 9, height: 9, offsetY: 28, type: "bead-gold" },
            { src: "./charms/ghanta.png", width: 68, height: 86, offsetY: 44, type: "image" },
        ],
    },
    {
        id: "scarab",
        name: "Scarab",
        origin: "ANCIENT EGYPT",
        description: "An ancient amulet for renewal and new beginnings. Spread its ceremonial wings for a moment, then let them rest.",
        actionLabel: "Spread the wings",
        previewImage: "./charms/scarab.png",
        threadPassesThrough: true,
        threadThroughLength: 46, // Extends directly inside the top golden eyelet
        anchorOffsetY: 0,
        stack: [
            { src: "", width: 9, height: 9, offsetY: 0, type: "bead-gold" },
            { src: "", width: 14, height: 14, offsetY: 11, type: "bead-turquoise" },
            { src: "", width: 9, height: 9, offsetY: 27, type: "bead-gold" },
            { src: "./charms/scarab.png", width: 68, height: 82, offsetY: 33, type: "image" }, // Shifted up from 44 to 37
        ],
    },
    {
        id: "four-leaf",
        name: "Four-leaf clover",
        origin: "IRELAND AND CELTIC TRADITIONS",
        description: "One leaf for faith, one for hope, one for love, and one for luck. A rare find kept close.",
        actionLabel: "Find a little luck",
        previewImage: "./charms/clover.png",
        threadPassesThrough: true,
        threadThroughLength: 52,
        anchorOffsetY: 0,
        stack: [
            { src: "", width: 10, height: 10, offsetY: 0, type: "bead-white" },
            { src: "", width: 14, height: 14, offsetY: 12, type: "bead-mini-clover" },
            { src: "", width: 10, height: 10, offsetY: 28, type: "bead-white" },
            { src: "./charms/clover.png", width: 72, height: 72, offsetY: 42, type: "image" },
        ],
    },
    {
        id: "horseshoe",
        name: "Horseshoe",
        origin: "EUROPE AND THE AMERICAS",
        description: "Hung points up so the luck stays put. A good flick is all this one needs.",
        actionLabel: "Give it a flick",
        previewImage: "./charms/horseshoe.png",
        threadPassesThrough: true,
        threadThroughLength: 46, // Extends directly through the top wire eyelet
        anchorOffsetY: 0,
        stack: [
            { src: "./charms/horse-head-bead.png", width: 26, height: 28, offsetY: 0 },
            { src: "./charms/horseshoe.png", width: 72, height: 74, offsetY: 36 }, // Shifted up from 40 to 36
        ],
    },
    {
        id: "nimbu-mirchi",
        name: "Nimbu-mirchi",
        origin: "INDIA",
        description: "Seven chillies and a lemon hung at the threshold to turn away misfortune. Replace it with a fresh one when the week is up.",
        actionLabel: "Hang a fresh garland",
        previewImage: "./charms/nimbu-lemon.png",
        threadPassesThrough: true,
        threadThroughLength: 160,
        anchorOffsetY: 0,
        stack: [
            { src: "./charms/nimbu-chili-1.png", width: 44, height: 20, offsetY: 0, spinPhase: 0 },
            { src: "./charms/nimbu-chili-2.png", width: 44, height: 20, offsetY: 12, spinPhase: 1.0 },
            { src: "./charms/nimbu-chili-3.png", width: 44, height: 20, offsetY: 24, spinPhase: 2.1 },
            { src: "./charms/nimbu-chili-4.png", width: 44, height: 20, offsetY: 36, spinPhase: 3.2 },
            { src: "./charms/nimbu-chili-5.png", width: 44, height: 20, offsetY: 48, spinPhase: 4.3 },
            { src: "./charms/nimbu-chili-6.png", width: 44, height: 20, offsetY: 60, spinPhase: 5.4 },
            { src: "./charms/nimbu-chili-7.png", width: 44, height: 20, offsetY: 72, spinPhase: 6.5 },
            { src: "./charms/nimbu-lemon.png", width: 56, height: 56, offsetY: 88, spinPhase: 0 },
            { src: "./charms/nimbu-coal.png", width: 28, height: 24, offsetY: 140, spinPhase: 0 },
        ],
    },
    {
        id: "chinese-knot",
        name: "Páncháng jié",
        origin: "CHINA",
        description: "One unbroken red cord tied for good fortune without end. Cinch it gently and let the tassel settle.",
        actionLabel: "Tie in good fortune",
        previewImage: "./charms/chinese-knot.png",
        threadPassesThrough: false,
        threadThroughLength: 4,
        anchorOffsetY: 0,
        stack: [{ src: "./charms/chinese-knot.png", width: 64, height: 112, offsetY: 0 }],
    },
    {
        id: "daruma",
        name: "Daruma",
        origin: "JAPAN",
        description: "A wishing doll for goals that take some grit. Paint one eye when you make a wish and the other when it comes true.",
        actionLabel: "Make a wish",
        previewImage: "./charms/daruma.png",
        threadPassesThrough: true,
        threadThroughLength: 52,
        anchorOffsetY: 0,
        stack: [
            { src: "", width: 9, height: 9, offsetY: 0, type: "bead-gold" },
            { src: "", width: 15, height: 15, offsetY: 11, type: "bead-red" },
            { src: "", width: 9, height: 9, offsetY: 28, type: "bead-gold" },
            { src: "./charms/daruma.png", width: 68, height: 70, offsetY: 44, type: "image" },
        ],
    },
    {
        id: "drishti-bommai",
        name: "Drishti bommai",
        origin: "SOUTH INDIA",
        description: "A fierce guardian painted to meet the first bad glance. Repaint it through seven colors whenever you want a fresh start.",
        actionLabel: "Repaint the guardian",
        previewImage: "./charms/drishti-bommai.png",
        threadPassesThrough: false,
        threadThroughLength: 4,
        anchorOffsetY: 0,
        stack: [{ src: "./charms/drishti-bommai.png", width: 74, height: 74, offsetY: 0 }],
    },
    {
        id: "himmeli",
        name: "Himmeli",
        origin: "FINLAND",
        description: "A rye-straw tradition for inviting abundance, prosperity, and a fruitful flow of work. Set its open geometry turning on an imagined current of air.",
        actionLabel: "Set it turning",
        previewImage: "./charms/himmeli.png",
        threadPassesThrough: false,
        threadThroughLength: 4,
        anchorOffsetY: 0,
        stack: [{ src: "./charms/himmeli.png", width: 66, height: 98, offsetY: 0 }],
    },
];
