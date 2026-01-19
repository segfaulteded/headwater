export const SERVICES = ["ankergames-service", "goggamesto-service", "steamunderground-service"] as const;
export type ServiceType = (typeof SERVICES)[number];
