import type { TransportType } from "~~/shared/types/transports";
import type { ProcessInput } from "../processors";

/**
 * A transport is some method to download a piece of content
 * Examples include HTTP, torrent, Usenet, etc
 *
 * All transport jobs are required to be **serializable** to the database,
 * to ensure we can resume jobs after boot.
 */
export abstract class Transport<T, K extends ProcessInput> {
  abstract type(): TransportType;
  abstract download(data: T, dir: string): Promise<K>
}
