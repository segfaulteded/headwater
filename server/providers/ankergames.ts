import type { ProviderSerialized } from ".";
import { Provider } from ".";
import type { ExecutorJobAccept } from "../executor";
import type { SingleFileProcess } from "../processors";
import { AnkerGamesSevenZipProcessor } from "../processors/ankergames-7zip";
import AnkerGamesService from "../services/ankergames";
import type { HTTPTransportData } from "../transports/http";
import HTTPTransport from "../transports/http";

interface AnkerGamesInit {
  job: ExecutorJobAccept;
}

export class AnkerGamesProvider extends Provider<
  HTTPTransportData,
  SingleFileProcess,
  AnkerGamesService,
  HTTPTransport,
  AnkerGamesSevenZipProcessor
> {
  constructor(init: AnkerGamesInit) {
    super(
      new AnkerGamesService(),
      new HTTPTransport(),
      new AnkerGamesSevenZipProcessor(),
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
