export const TRANSPORTS = ["http", "torrent"] as const;
export type TransportType = (typeof TRANSPORTS)[number];
