import z from "zod";
import type {
  Service,
  ServiceQueryOptions,
  ServiceQueryResponse,
  ServiceQueryResponseItem,
} from ".";
import type { ExecutorJobAccept } from "../executor";
import { fuzzy } from "fast-fuzzy";
import parse from "node-html-parser";
import type { TorrentTransportData } from "../transports/torrent";

const gogGames = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  image: z.string(),
});

const API_BASE_URL = "https://gog-games.to/api";
let GOGGAMES_CACHE: Array<z.infer<typeof gogGames>> | undefined = undefined;
async function fetchGOGGames() {
  if (GOGGAMES_CACHE) return GOGGAMES_CACHE;
  const result = await $fetch(`${API_BASE_URL}/web/all-games`);
  const games = z.array(gogGames).parse(result);
  GOGGAMES_CACHE = games;
}

// 1000 years
const forever = 1000 * 60 * 60 * 24 * 365 * 1000;

/**
 * Service for https://gog-games.to
 *
 * They have an API: https://gog-games.to/docs/
 */
export class GOGGamesToService implements Service<TorrentTransportData> {
  type(): ServiceType {
    return "goggamesto-service";
  }

  async query(opts: ServiceQueryOptions): Promise<ServiceQueryResponse> {
    await fetchGOGGames();
    const data = GOGGAMES_CACHE!;
    const results = data
      .map((v) => ({ ...v, score: fuzzy(v.title, opts.query) }))
      .filter((v) => v.score > 0.8)
      .sort((a, b) => a.score - b.score);

    return results.map(
      (v) =>
        ({
          job: {
            id: v.id,
            libraryPath: v.slug,
            version: "no-version",
            provider: "ankergames-provider",
          },
          title: v.title,
          description: "",
          cover: `https://images.gog-statics.com/${v.image}.webp`,
        }) satisfies ServiceQueryResponseItem,
    );
  }

  async fetch(job: ExecutorJobAccept): Promise<TorrentTransportData> {
    const htmlRaw = await $fetch<string>(
      `${API_BASE_URL}/web/query-game/${job.id}`,
    );
    const html = parse(htmlRaw);

    const magnetButton = html.querySelector(".btn-torrent");
    const magnetUrl = magnetButton?.attributes?.["href"];
    if (!magnetUrl) throw new Error("Failed to find magnet URL in webpage");

    return {
      type: "magnet",
      url: magnetUrl,
      expiry: new Date(Date.now() + forever),
    };
  }
}
