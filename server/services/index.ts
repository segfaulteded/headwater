import type { ServiceType } from "~~/shared/types/services";

/**
 * Services search websites or other indexes for content to download
 */
export abstract class Service {
  abstract type(): ServiceType;

  abstract query(opts: ServiceQueryOptions): ServiceQueryResponse;
}

export interface ServiceQueryOptions {
  name: string;
}

export type ServiceQueryResponse = Array<unknown>;
