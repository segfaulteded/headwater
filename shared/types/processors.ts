export const PROCESSORS = ["7z", "repack"] as const;
export type ProcessorType = (typeof PROCESSORS)[number];
