import type { TransportType } from "~~/shared/types/transports";

/**
 * A transport is some method to download a piece of content
 * Examples include HTTP, torrent, Usenet, etc
 *
 * All transport jobs are required to be **serializable** to the database,
 * to ensure we can resume jobs after boot.
 */
export abstract class Transport<T> {
  abstract type(): TransportType;
  abstract download(data: T, dir: string): Promise<void>
}
