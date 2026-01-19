export const PROVIDERS = ["ankergames-provider", "goggamesto-provider", "steamunderground-provider"] as const;
export type ProviderType = (typeof PROVIDERS)[number];
