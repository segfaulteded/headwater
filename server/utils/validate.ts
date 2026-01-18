import type { ZodObject } from "zod";
import type { H3Event } from "h3";

export async function readZodBody<T extends ZodObject>(h3: H3Event, validator: T) {
  const body = await readBody(h3);
  const results = await validator.safeParseAsync(body);
  if (!results.success)
    throw createError({ status: 400, message: results.error.message });
  return results.data;
}

export async function readZodQuery<T extends ZodObject>(
  h3: H3Event,
  validator: T,
) {
  const query = await getQuery(h3);
  const results = await validator.safeParseAsync(query);
  if (!results.success)
    throw createError({ status: 400, message: results.error.message });
  return results.data;
}
