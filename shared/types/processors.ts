export const PROCESSORS = ["7z", "repack", "ankergames-7z"] as const;
export type ProcessorType = (typeof PROCESSORS)[number];
