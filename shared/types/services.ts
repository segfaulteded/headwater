export const SERVICES = ["ankergames-service", "goggamesto-service"] as const;
export type ServiceType = (typeof SERVICES)[number];
