import type { TransportType } from "~~/shared/types/transports";
import type { Transport } from ".";
import path from "node:path";
import fs from "node:fs";
import { open, writeFile } from 'node:fs/promises';
import { Writable } from "node:stream";

export default class HTTPTransport implements Transport<HTTPTransportData> {
  type(): TransportType {
    return "http";
  }

  async download(data: HTTPTransportData, dir: string) {
    const downloadFile = path.join(dir, "_download");
    const downloadFileStat = fs.statSync(downloadFile, {
      throwIfNoEntry: false,
    });
    const start = downloadFileStat ? downloadFileStat.size + 1 : 0;
    if(!downloadFileStat) await writeFile(downloadFile, "");

    const downloadFileHandle = await open(downloadFile, "r+");
    const downloadFileStream = downloadFileHandle.createWriteStream({
      start: start,
      flush: true,
    });

    const headers = new Headers();
    if (downloadFileStat) headers.set("Range", `bytes=${start}-`);

    const downloadStream: ReadableStream<Uint8Array> = await $fetch(
      data.endpoint,
      {
        responseType: "stream",
        headers,
      },
    );

    await downloadStream
      .pipeThrough(new ProgressReportingStream())
      .pipeTo(Writable.toWeb(downloadFileStream));
  }
}

class ProgressReportingStream extends TransformStream {
  constructor() {
    super({
      start() {},
      flush() {},
      async transform(chunk, controller) {
        controller.enqueue(chunk);
      },
    });
  }
}

export interface HTTPTransportData {
  endpoint: string;
  expiry: Date;
}
