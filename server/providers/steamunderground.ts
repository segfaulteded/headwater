import type { ProviderSerialized } from ".";
import { Provider } from ".";
import type { ExecutorJobAccept } from "../executor";
import type { SingleFileProcess } from "../processors";
import { NestedSevenZipProcessor } from "../processors/7zip-nested";
import { SteamUndergroundService } from "../services/steamunderground";
import type { HTTPTransportData } from "../transports/http";
import HTTPTransport from "../transports/http";

export class SteamUndergroundProvider extends Provider<
  HTTPTransportData,
  SingleFileProcess,
  SteamUndergroundService,
  HTTPTransport,
  NestedSevenZipProcessor
> {
  constructor(job: ExecutorJobAccept) {
    super(
      new SteamUndergroundService(),
      new HTTPTransport(),
      new NestedSevenZipProcessor(),
      job,
    );
  }

  type(): ProviderType {
    return "steamunderground-provider";
  }

  async serialize(): Promise<ProviderSerialized> {
    throw new Error("Method not implemented.");
  }
}
