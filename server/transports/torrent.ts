import z from "zod";
import type { Transport } from ".";
import type { DirectoryProcess } from "../processors";
import crypto from "node:crypto";

interface MagnetDownload {
  type: "magnet";
  url: string;
}

interface TorrentDownload {
  type: "torrent";
  data: Blob;
}

export type TorrentTransportData = (MagnetDownload | TorrentDownload) & {
  expiry: Date;
  id: string;
  version: string;
};

const torrentInfoResponse = z.array(
  z.object({
    eta: z.number(),
    hash: z.string(),
    name: z.string(),
    progress: z.number(),
    state: z.string(),
  }),
);

// const FINISHED_STATES = ["checkingUP", "stalledUP", "pausedUP", "uploading", "queuedUP", "forcedUP"];

export class TorrentTransport implements Transport<
  TorrentTransportData,
  DirectoryProcess
> {
  private auth: { endpoint: string; username: string; password: string };
  private cookie?: string;

  constructor() {
    const endpoint = process.env.QBIT_URL;
    const username = process.env.QBIT_USERNAME;
    const password = process.env.QBIT_PASSWORD;
    if (!endpoint || !username || !password)
      throw new Error("Started torrent download without setting env");
    const normalizedEndpoint = new URL(endpoint).toString();
    this.auth = { endpoint: normalizedEndpoint, username, password };
  }

  private async signin() {
    let cookie: string | undefined;
    const formData = new FormData();
    formData.append("username", this.auth.username);
    formData.append("password", this.auth.password);
    await $fetch(`${this.auth.endpoint}api/v2/auth/login`, {
      body: formData,
      method: "POST",
      async onResponse({ response }) {
        cookie = response.headers.get("set-cookie") ?? undefined;
      },
    });
    if (!cookie) throw new Error("No cookie returned in qBittorrent signin");
    this.cookie = cookie.slice(0, cookie.indexOf(";"));
  }

  type(): TransportType {
    return "torrent";
  }

  private async queryTorrents(trackingId: string, headers: Headers) {
    const torrentResults = torrentInfoResponse.parse(
      await $fetch(
        `${this.auth.endpoint}api/v2/torrents/info?tag=tracking-${trackingId}`,
        {
          headers,
        },
      ),
    );
    return torrentResults;
  }

  async download(
    data: TorrentTransportData,
    dir: string,
  ): Promise<DirectoryProcess> {
    if (!this.cookie) await this.signin();
    if (!this.cookie) throw new Error("No cookie set after signin");

    const trackingId = crypto
      .createHash("md5")
      .update(data.id)
      .update(data.version)
      .digest("hex");

    const headers = new Headers();
    headers.set("Cookie", this.cookie);

    const torrentResults = await this.queryTorrents(trackingId, headers);
    const torrent = torrentResults.at(0);

    if (!torrent) {
      const formData = new FormData();
      if (data.type === "magnet") {
        formData.append("urls", data.url);
      } else if (data.type === "torrent") {
        formData.append("torrents", data.data);
      }

      formData.append("savepath", dir);
      formData.append("tags", `tracking-${trackingId},headwater`);

      await $fetch(`${this.auth.endpoint}api/v2/torrents/add`, {
        headers,
        body: formData,
        method: "POST",
      });
    } else {
      // =========== CAUTION ==========
      // There's a return here.
      if (torrent.state.endsWith("UP")) return { directory: dir };
    }

    // Poll check for download status
    let interval: NodeJS.Timeout | undefined = undefined;
    try {
      await new Promise<void>((resolve, reject) => {
        interval = setInterval(
          async () => {
            const torrentResults = await this.queryTorrents(
              trackingId,
              headers,
            );
            const torrent = torrentResults.at(0);
            if (!torrent) return reject("Torrent disappeared..?");
            if (torrent.state.endsWith("UP")) return resolve();
            console.log(
              `[torrent] ${torrent.name} ${torrent.eta}s ${torrent.progress}%`,
            );
          },
          1000 * 60 * 1,
        ); // Every minute
      });
    } catch (e) {
      if (interval) clearInterval(interval);
      throw e;
    }
    if (interval) clearInterval(interval);

    // CAUTION
    // There is another return further up
    return { directory: dir };
  }
}
