export const PROCESSORS = ["7z", "repack", "gog-unpacker", "ankergames-7z", "null"] as const;
export type ProcessorType = (typeof PROCESSORS)[number];
