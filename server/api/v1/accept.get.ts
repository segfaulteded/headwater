import z from "zod";
import EXECUTOR from "~~/server/executor";

const acceptQuery = z.object({
  id: z.string(),
  version: z.string(),
  provider: z.literal(PROVIDERS)
})

export default defineEventHandler(async (h3) => {
  const query = await readZodQuery(h3, acceptQuery);

  await EXECUTOR.accept({
    id: query.id,
    libraryPath: query.id,
    version: query.version,
    provider: query.provider
  });

  return {};
});
