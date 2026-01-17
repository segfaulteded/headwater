import type { Processor } from "../processors";
import type { Service } from "../services";
import type { Transport } from "../transports";

/**
 * Providers are specific websites or ways of accessing games
 * that combine:
 *  - a service: searchs for content
 *  - a transport: downloads content
 *  - a processor: processes content (extract)
 *
 * Generally, a provider is written for each website that can be
 * downloadded from, or some application that interfaces with multiple (Prowlarr)
 */
export abstract class Provider<S extends Service, T extends Transport, P extends Processor> {
  private service: S;
  private transport: T;
  private processor: P;

  constructor(service: S, transport: T, processor: P) {
    this.service = service;
    this.transport = transport;
    this.processor = processor;
  }
}
