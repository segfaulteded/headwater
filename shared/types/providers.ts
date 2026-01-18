export const PROVIDERS = ["ankergames-provider"] as const;
export type ProviderType = (typeof PROVIDERS)[number];
