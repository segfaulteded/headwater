import type { ExecutorJobAccept } from "../executor";
import type { Processor } from "../processors";
import type { Service } from "../services";
import type { Transport } from "../transports";
import type { ProviderType } from "~~/shared/types/providers";
import path from "node:path";
import fs from "node:fs";

export type ProviderDeserializer = (
  serialized: ProviderSerialized,
) => Provider<never, never, never, never>;
export const PROVIDER_DESERIALIZE: {
  [key in ProviderType]: ProviderDeserializer;
} = {
  "ankergames-provider": (_serialized) => {
    throw "Not implemented yet.";
  },
};

export type ProviderCreator = (
  job: ExecutorJobAccept,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => Promise<Provider<any, any, any, any>>;
export const PROVIDER_CREATE: {
  [key in ProviderType]: ProviderCreator;
} = {
  "ankergames-provider": async (job) => {
    const { AnkerGamesProvider } = await import("./ankergames");

    const provider = new AnkerGamesProvider({ job });
    return provider;
  },
};

export const PROVIDER_STATUSES = [
  "init",
  "service",
  "transport",
  "processing",
  "finalizing",
] as const;
export type ProviderStatus = (typeof PROVIDER_STATUSES)[number];

interface InitData {
  tmpDir: string;
  outputDir: string;
}

export const TMP_DIR = process.env.TMP_DIR ?? "/tmp";
export const OUTPUT_DIR = process.env.OUTPUT_DIR ?? "./library";

/**
 * Providers are specific websites or ways of accessing games
 * that combine:
 *  - a service: searchs for content
 *  - a transport: downloads content
 *  - a processor: processes content (extract)
 *
 * Generally, a provider is written for each website that can be
 * downloaded from, or some application that interfaces with multiple (Prowlarr)
 *
 * Providers are instatiated for each job
 */
export abstract class Provider<
  TT extends { expiry: Date }, /// Transport type
  S extends Service<TT>, /// Service
  T extends Transport<TT>, /// Transport
  P extends Processor, /// Processor
> {
  service: S;
  transport: T;
  processor: P;
  job: ExecutorJobAccept;
  data: {
    initData?: InitData;
    transportData?: TT;
  } = {};

  constructor(service: S, transport: T, processor: P, job: ExecutorJobAccept) {
    this.service = service;
    this.transport = transport;
    this.processor = processor;
    this.job = job;
  }

  abstract type(): ProviderType;
  abstract serialize(): Promise<ProviderSerialized>;

  async init() {
    const tmpDir = path.resolve(TMP_DIR, this.job.id, this.job.version);
    fs.mkdirSync(tmpDir, { recursive: true });
    const outputDir = path.resolve(
      OUTPUT_DIR,
      this.job.libraryPath,
      this.job.version,
    );
    fs.mkdirSync(outputDir, { recursive: true });
    this.data.initData = {
      tmpDir,
      outputDir,
    };
  }

  async runService() {
    if (!this.data.initData) throw new Error("Out of order");
    const transport = await this.service.fetch(this.job);
    this.data.transportData = transport;
  }

  async runTransport() {
    if (!this.data.initData || !this.data.transportData)
      throw new Error("Out of order");
    await this.transport.download(
      this.data.transportData,
      this.data.initData.tmpDir,
    );
  }

  async runProcessing() {
    console.log("transport done");
  }

  async finalize() {}

  fetchStatus(): ProviderStatus {
    if (
      this.data.transportData &&
      Date.now() <= this.data.transportData.expiry.getTime()
    )
      return "transport";
    if (this.data.initData) return "service";

    return "init";
  }

  run() {
    runTask("executor", { payload: { provider: this } });
  }
}

export type ProviderSerialized = [ProviderType, string];
