import type { ServiceType } from "~~/shared/types/services";
import type { Service, ServiceQueryOptions, ServiceQueryResponseItem } from ".";
import { HTMLElement, parse } from "node-html-parser";
import z from "zod";
import type { HTTPTransportData } from "../transports/http";
import type { ExecutorJobAccept } from "../executor";
import { VersionMismatch } from "./errors";
import { devices, firefox } from "playwright";

const ListingResult = z.object({
  slug: z.string(),
  title: z.string(),
  type: z.literal("game"),
  overview: z.string(),
  size_gb: z.string(),
  imageurl: z.string(),
  vote_average: z.string(),
});

const VERSION_SELECTOR = ".animate-glow";

const DOWNLOAD_LINK =
  "li.inline-flex:nth-child(1) > div:nth-child(2) > a:nth-child(1)";

interface GenerateDownloadUrlResponse {
  success: true;
  download_url: string;
}

const DAY_MILLIS = 1000 * 60 * 60 * 24;

export default class AnkerGamesService implements Service<HTTPTransportData> {
  private baseURL: string = "https://ankergames.net";

  type(): ServiceType {
    return "ankergames-service";
  }

  async query(opts: ServiceQueryOptions) {
    const searchPage = await $fetch<string>(
      `${this.baseURL}/search/${encodeURIComponent(opts.query)}`,
    );
    const searchPageParsed = parse(searchPage);

    const searchTable = searchPageParsed.querySelector(
      "div.grid:nth-child(6)",
    )!;
    const resultsItem = searchTable.childNodes.filter(
      (v) => v instanceof HTMLElement,
    );

    const resultsListings = resultsItem.map((v) =>
      ListingResult.parse(JSON.parse(v.attributes["listing"])),
    );

    return resultsListings.map(
      (listing) =>
        ({
          title: listing.title,
          description: listing.overview,
          cover: listing.imageurl,
          size: listing.size_gb + " GB",
          job: {
            id: listing.slug,
            libraryPath: listing.title,
            provider: "ankergames-provider",
            version: listing.vote_average, // For some reason, this is the version
          },
        }) satisfies ServiceQueryResponseItem,
    );
  }

  async fetch(job: ExecutorJobAccept): Promise<HTTPTransportData> {
    let cookies: string | undefined;

    const htmlRaw = await $fetch<string>(`${this.baseURL}/game/${job.id}`, {
      async onResponse({ response }) {
        const cookieString = response.headers
          .entries()
          .filter((v) => v[0] == "set-cookie")
          .map((v) => v[1].split(";").at(0)!.toString())
          .toArray()
          .join("; ");
        cookies = cookieString;
      },
    });
    const html = parse(htmlRaw);

    const version = html.querySelector(VERSION_SELECTOR)?.textContent?.trim();
    if (!version || job.version !== version)
      throw new VersionMismatch(job.version, version ?? "(no version found)");

    const tokenEl = html.querySelector('meta[name="csrf-token"]');
    if (!tokenEl) throw new Error("No CSRF token present in request");
    const csrfToken = tokenEl.attributes["content"];

    const downloadCommand =
      html.querySelector(DOWNLOAD_LINK)?.attributes["@click.prevent"];
    if (!downloadCommand)
      throw new Error(
        "Failed to find download link - is this integration broken?",
      );
    const downloadId = downloadCommand.slice("generateDownloadUrl(".length, -1);

    const headers = new Headers();
    headers.set("X-CSRF-TOKEN", csrfToken);
    if (cookies) headers.set("Cookie", cookies);
    headers.set(
      "User-Agent",
      "Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0",
    );

    const { download_url } = await $fetch<GenerateDownloadUrlResponse>(
      `${this.baseURL}/generate-download-url/${downloadId}`,
      {
        method: "POST",
        headers,
        body: {
          "g-recaptcha-response": "development-mode", // They have reCAPTCHA disabled for some reason
        },
      },
    );

    const browser = await firefox.launch();
    const context = await browser.newContext(devices["Desktop Firefox"]);
    const page = await context.newPage();

    await page.goto(download_url);

    const downloadLink = await page.$("a.download-btn-reveal");
    if (!downloadLink) throw new Error("Download link not present");
    const endpoint = await downloadLink.getAttribute("href");

    return { endpoint: endpoint!, expiry: new Date(Date.now() + DAY_MILLIS) };
  }
}
