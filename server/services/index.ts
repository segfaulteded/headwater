import type { ServiceType } from "~~/shared/types/services";
import type { ExecutorJobAccept } from "../executor";
import AnkerGamesService from "./ankergames";
import { GOGGamesToService } from "./goggamesto";
import { SteamUndergroundService } from "./steamunderground";

/// Pre-defined list of services for searching for a query
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SERVICES: Array<Service<any>> = [
  new AnkerGamesService(), /// Multiline
  new GOGGamesToService(), /// Multiline
  new SteamUndergroundService(), /// Multiline
];

/**
 * Services search websites or other indexes for content to download
 */
export abstract class Service<T extends { expiry: Date }> {
  abstract type(): ServiceType;

  abstract query(opts: ServiceQueryOptions): Promise<ServiceQueryResponse>;

  abstract fetch(job: ExecutorJobAccept): Promise<T>;
}

export interface ServiceQueryOptions {
  query: string;
}

export type ServiceQueryResponseItem = {
  job: ExecutorJobAccept;
  title: string;
  description: string;
  cover: string;
  size?: string;
};
export type ServiceQueryResponse = Array<ServiceQueryResponseItem>;
