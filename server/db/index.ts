import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";

export const DRIZZLE = drizzle(process.env.DATABASE_URL!);
