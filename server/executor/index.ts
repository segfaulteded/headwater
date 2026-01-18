/**
 * The executor is responsible for taking requests and launching
 * the providers to kickstart the job process
 */

import type { ProviderType } from "~~/shared/types/providers";
import { PROVIDER_CREATE, type Provider } from "../providers";
import type { ServiceQueryResponseItem} from "../services";
import { SERVICES } from "../services";

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
  private jobs: Map<string, Provider<any, any, any, any>> = new Map();

  async search(query: ExecutorQuery) {
    const resultsPromises = [];
    for (const service of SERVICES) {
      resultsPromises.push(service.query({ query: query.name }));
    }
    const results = await Promise.allSettled(resultsPromises);
    const successes: ServiceQueryResponseItem[] = [];
    const errors: string[] = [];
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        successes.push(...result.value);
        return;
      }
      errors.push(result.reason.toString());
    });
    return { result: successes.flat(), errors };
  }

  async accept(job: ExecutorJobAccept) {
    const provider = await PROVIDER_CREATE[job.provider](job);
    this.jobs.set(crypto.randomUUID(), provider);
    await provider.run();
  }
}

export const EXECUTOR = new Executor();
export default EXECUTOR;
