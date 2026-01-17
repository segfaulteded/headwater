export const SERVICES = ["AnkerGames", "prowlarr"] as const;
export type ServiceType = (typeof SERVICES)[number];
