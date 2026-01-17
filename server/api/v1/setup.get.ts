import { DRIZZLE } from "~~/server/db";
import { appConfigTable } from "~~/server/db/schema";

export default defineEventHandler(async () => {
  const appConfig = (await DRIZZLE.select().from(appConfigTable).limit(1)).at(
    0,
  );
  return { needsSetup: appConfig === undefined };
});
