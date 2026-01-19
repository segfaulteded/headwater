import type { ExecutorJobAccept } from "../executor";
import type { ProcessInput, Processor } from "../processors";
import type { Service } from "../services";
import type { Transport } from "../transports";
import type { ProviderType } from "~~/shared/types/providers";
import path from "node:path";
import fs from "node:fs";

export type ProviderDeserializer = (
  serialized: ProviderSerialized,
) => Provider<never, never, never, never, never>;
export const PROVIDER_DESERIALIZE: {
  [key in ProviderType]: ProviderDeserializer;
} = {
  "ankergames-provider": (_serialized) => {
    throw "Not implemented yet.";
  },
  "goggamesto-provider": (_serialized) => {
    throw "Not implemented yet.";
  }
};

export type ProviderCreator = (
  job: ExecutorJobAccept,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => Promise<Provider<any, any, any, any, any>>;
export const PROVIDER_CREATE: {
  [key in ProviderType]: ProviderCreator;
} = {
  "ankergames-provider": async (job) => {
    const { AnkerGamesProvider } = await import("./ankergames");

    const provider = new AnkerGamesProvider({ job });
    return provider;
  },
  "goggamesto-provider": async (job) => {
    const { GOGGamesToProvider } = await import("./goggamesto");

    const provider = new GOGGamesToProvider(job);
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
  PT extends ProcessInput, /// Process type
  S extends Service<TT>, /// Service
  T extends Transport<TT, PT>, /// Transport
  P extends Processor<PT>, /// Processor
> {
  service: S;
  transport: T;
  processor: P;
  job: ExecutorJobAccept;
  data: {
    initData?: InitData;
    serviceResult?: TT;
    transportResult?: PT;
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
    console.log("running service...");
    const serviceResult = await this.service.fetch(this.job);
    this.data.serviceResult = serviceResult;
  }

  async runTransport() {
    if (!this.data.initData || !this.data.serviceResult)
      throw new Error("Out of order");
    console.log("running transport...");
    const transportResult = await this.transport.download(
      this.data.serviceResult,
      this.data.initData.tmpDir,
    );
    this.data.transportResult = transportResult;
  }

  async runProcessing() {
    if (!this.data.initData || !this.data.transportResult)
      throw new Error("Out of order");
    console.log("running processing...");
    await this.processor.process(
      this.data.transportResult,
      this.data.initData.outputDir,
    );
  }

  async finalize() {}

  fetchStatus(): ProviderStatus {
    if (this.data.transportResult) return "processing";
    if (
      this.data.serviceResult &&
      Date.now() <= this.data.serviceResult.expiry.getTime()
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
