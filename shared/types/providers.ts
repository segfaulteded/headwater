export const PROVIDERS = ["ankergames-provider", "goggamesto-provider"] as const;
export type ProviderType = (typeof PROVIDERS)[number];
