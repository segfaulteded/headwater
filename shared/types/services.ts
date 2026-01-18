export const SERVICES = ["ankergames-service"] as const;
export type ServiceType = (typeof SERVICES)[number];
