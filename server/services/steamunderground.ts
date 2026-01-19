import { HTMLElement, parse } from "node-html-parser";
import type { Service, ServiceQueryOptions, ServiceQueryResponse } from ".";
import type { ExecutorJobAccept } from "../executor";
import type { HTTPTransportData } from "../transports/http";
import { CLICKTHROUGH_LINK_BYPASSES } from "~~/shared/utils/clickthrough";

const DAY_MILLIS = 1000 * 60 * 60 * 24;

export class SteamUndergroundService implements Service<HTTPTransportData> {
  private baseURL: string = "https://steamunderground.net";

  type(): ServiceType {
    return "steamunderground-service";
  }

  async query(opts: ServiceQueryOptions): Promise<ServiceQueryResponse> {
    const htmlRaw = await $fetch<string>(
      `${this.baseURL}/?s=${encodeURIComponent(opts.query)}`,
    );
    const html = parse(htmlRaw);

    const resultsGrid = html.querySelector(".bk-row-wrap");
    if (!resultsGrid)
      throw new Error("No results grid - did the website change?");
    const results = resultsGrid.childNodes.filter(
      (v) => v instanceof HTMLElement,
    );

    const queryResponse: ServiceQueryResponse = [];

    for (const result of results) {
      const link = result.querySelector("h4 > a")!;
      const name = link.textContent;
      const cover = result.querySelector("img")!;
      const coverUrl = cover.attributes["src"];
      const id = link.attributes["href"].slice(this.baseURL.length + 1, -1);
      const descriptionEl = result.querySelector(".excerpt")!;
      const description = descriptionEl.textContent;

      queryResponse.push({
        job: {
          id,
          libraryPath: id,
          version: "noversion",
          provider: "steamunderground-provider",
        },
        title: name,
        description,
        cover: coverUrl,
      });
    }

    return queryResponse;
  }

  async fetch(job: ExecutorJobAccept): Promise<HTTPTransportData> {
    const htmlRaw = await $fetch(`${this.baseURL}/${job.id}/`);
    const html = parse(htmlRaw);

    const downloadLinks = html
      .querySelectorAll(".enjoy-css")
      .filter((v) => !v.textContent.toLowerCase().includes("torrent"))
      .map((v) => v.attributes["href"]);

    for (const downloadLink of downloadLinks) {
      const host = new URL(downloadLink).host;
      const bypassFunc = CLICKTHROUGH_LINK_BYPASSES.get(host);
      if (bypassFunc) {
        const realLink = await bypassFunc(downloadLink);
        return {
          endpoint: realLink,
          expiry: new Date(Date.now() + DAY_MILLIS),
        };
      }
    }

    throw new Error("No supported links for download.");
  }
}
