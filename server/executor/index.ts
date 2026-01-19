/**
 * The executor is responsible for taking requests and launching
 * the providers to kickstart the job process
 */

import type { ProviderType } from "~~/shared/types/providers";
import { PROVIDER_CREATE, type Provider } from "../providers";
import type {
  ServiceQueryResponse,
  ServiceQueryResponseItem,
} from "../services";
import { SERVICES } from "../services";
import { ServiceType } from "~~/shared/types/services";

export interface ExecutorJobAccept {
  id: string;
  libraryPath: string;
  version: string;
  provider: ProviderType;
}

export interface ExecutorQuery {
  name: string;
}

export class Executor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private jobs: Map<string, Provider<any, any, any, any, any>> = new Map();

  async search(query: ExecutorQuery) {
    const resultsPromises: {
      [key: string]: Promise<ServiceQueryResponse>;
    } = {};
    for (const service of SERVICES) {
      resultsPromises[service.type()] = service.query({ query: query.name });
    }
    const results: { [key: string]: ServiceQueryResponse } = {};
    const errors: { [key: string]: string } = {};

    for (const [name, promise] of Object.entries(resultsPromises)) {
      try {
        const result = await promise;
        results[name] = result;
      } catch (e) {
        errors[name] = (e as string).toString();
      }
    }
    return { results: Object.values(results).flat(), errors };
  }

  async accept(job: ExecutorJobAccept) {
    const provider = await PROVIDER_CREATE[job.provider](job);
    this.jobs.set(crypto.randomUUID(), provider);
    await provider.run();
  }
}

export const EXECUTOR = new Executor();
export default EXECUTOR;
