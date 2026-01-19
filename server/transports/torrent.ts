import type { Transport } from ".";
import type { DirectoryProcess } from "../processors";

export type TorrentTransportData =
  | {
      type: "magnet";
      url: string;
      expiry: Date;
    }
  | {
      type: "torrent";
      data: Buffer;
      expiry: Date;
    };

export class TorrentTransport implements Transport<
  TorrentTransportData,
  DirectoryProcess
> {
  type(): TransportType {
    throw new Error("Method not implemented.");
  }

  download(data: TorrentTransportData, dir: string): Promise<DirectoryProcess> {
    throw new Error("Method not implemented.");
  }
}
