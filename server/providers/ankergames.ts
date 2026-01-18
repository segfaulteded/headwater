import type { ProviderSerialized } from ".";
import { Provider } from ".";
import type { ExecutorJobAccept } from "../executor";
import { SevenZipProcessor } from "../processors/7zip";
import AnkerGamesService from "../services/ankergames";
import type { HTTPTransportData } from "../transports/http";
import HTTPTransport from "../transports/http";

interface AnkerGamesInit {
  job: ExecutorJobAccept;
}

export class AnkerGamesProvider extends Provider<
  HTTPTransportData,
  AnkerGamesService,
  HTTPTransport,
  SevenZipProcessor
> {
  constructor(init: AnkerGamesInit) {
    super(
      new AnkerGamesService(),
      new HTTPTransport(),
      new SevenZipProcessor(),
      init.job,
    );
  }

  type(): ProviderType {
    return "ankergames-provider";
  }

  serialize(): Promise<ProviderSerialized> {
    throw new Error("Method not implemented.");
  }
}
