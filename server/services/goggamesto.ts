import z from "zod";
import type {
  Service,
  ServiceQueryOptions,
  ServiceQueryResponse,
  ServiceQueryResponseItem,
} from ".";
import type { ExecutorJobAccept } from "../executor";
import { fuzzy } from "fast-fuzzy";
import type { TorrentTransportData } from "../transports/torrent";

const gogGames = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  image: z.string(),
  last_update: z.string().or(z.null()),
  infohash: z.string().or(z.null()),
});

const API_BASE_URL = "https://gog-games.to/api";
let GOGGAMES_CACHE: Map<string, z.infer<typeof gogGames>> | undefined =
  undefined;
async function fetchGOGGames() {
  if (GOGGAMES_CACHE) return GOGGAMES_CACHE;
  const result = await $fetch(`${API_BASE_URL}/web/all-games`);
  const games = z
    .array(gogGames)
    .parse(result)
    .filter((v) => v.infohash);
  const gameMap = new Map();
  for (const game of games) {
    gameMap.set(game.slug, game);
  }
  GOGGAMES_CACHE = gameMap;
  return GOGGAMES_CACHE;
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
    const data = await fetchGOGGames();
    const results = data
      .values()
      .map((v) => ({ ...v, score: fuzzy(v.title, opts.query) }))
      .filter((v) => v.score > 0.8)
      .toArray()
      .sort((a, b) => a.score - b.score);

    return results.map(
      (v) =>
        ({
          job: {
            id: v.slug,
            libraryPath: v.slug,
            version: v.last_update
              ? new Date(v.last_update).getTime().toString()
              : "no-version",
            provider: "goggamesto-provider",
          },
          title: v.title,
          description: "",
          cover: `https://images.gog-statics.com/${v.image}.webp`,
        }) satisfies ServiceQueryResponseItem,
    );
  }

  async fetch(job: ExecutorJobAccept): Promise<TorrentTransportData> {
    const data = await fetchGOGGames();

    const game = data.get(job.id);
    if (!game) throw new Error("Invalid ID");
    if (
      game.last_update &&
      job.version !== new Date(game.last_update).getTime().toString()
    )
      throw new Error("Mismatched version");

    const magnet = "magnet:?xt=urn:btih:"
      .concat(game.infohash!, "&tr=")
      .concat("udp://tracker.opentrackr.org:1337/announce", "&tr=")
      .concat("udp://exodus.desync.com:6969/announce", "&tr=")
      .concat("udp://open.stealth.si:80/announce", "&tr=")
      .concat("udp://tracker-udp.gbitt.info:80/announce");

    return {
      type: "magnet",
      url: magnet,
      expiry: new Date(Date.now() + forever),
      id: job.id,
      version: job.version,
    };
  }
}
