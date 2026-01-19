import type { ProviderSerialized } from ".";
import { Provider } from ".";
import type { ExecutorJobAccept } from "../executor";
import type { DirectoryProcess } from "../processors";
import { GOGUnpacker } from "../processors/gog-unpack";
import { GOGGamesToService } from "../services/goggamesto";
import type { TorrentTransportData } from "../transports/torrent";
import { TorrentTransport } from "../transports/torrent";

export class GOGGamesToProvider extends Provider<
  TorrentTransportData,
  DirectoryProcess,
  GOGGamesToService,
  TorrentTransport,
  GOGUnpacker
> {
  constructor(job: ExecutorJobAccept) {
    super(
      new GOGGamesToService(),
      new TorrentTransport(),
      new GOGUnpacker(),
      job,
    );
  }

  type(): ProviderType {
    return "goggamesto-provider";
  }

  async serialize(): Promise<ProviderSerialized> {
    throw new Error("Method not implemented.");
  }
}
