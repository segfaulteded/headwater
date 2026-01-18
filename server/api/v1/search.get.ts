import z from "zod";
import EXECUTOR from "~~/server/executor";
import { readZodQuery } from "~~/server/utils/validate";

const searchQuery = z.object({
  q: z.string(),
});

export default defineEventHandler(async (h3) => {
  const query = await readZodQuery(h3, searchQuery);
  const results = await EXECUTOR.search({
    name: query.q,
  });

  return results;
});
