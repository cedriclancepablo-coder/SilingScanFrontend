import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "./schema/index.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required. Add your Neon/PostgreSQL connection string to SilingScan-Backend/.env.",
  );
}

const client = neon(databaseUrl);
export const db = drizzle({ client, schema });

export const verifyDatabaseConnection = async (): Promise<void> => {
  await db.execute(sql`select 1`);
};
