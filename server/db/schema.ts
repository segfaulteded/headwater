import {
  date,
  pgEnum,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";

export const versionStatus = pgEnum("versionStatus", [
  "searching",
  "downloading",
  "processing",
  "imported",
]);

export const gamesTable = pgTable("games", {
  dropId: uuid().primaryKey(),
  searchName: text(),
});

export const versionsTable = pgTable("versions", {
  id: uuid().primaryKey().defaultRandom(),
  name: text(),
  targetDir: text(),
  status: versionStatus(),
});

export const appConfigTable = pgTable("appConfig", {
  dropEndpoint: text().primaryKey(),
  token: text().notNull(),
});


export const jobsTable = pgTable("jobs", {
  randomId: uuid().primaryKey().defaultRandom(),
  serialized: text().notNull(),
  lastUpdated: date().notNull(),
})
