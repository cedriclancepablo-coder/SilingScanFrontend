import "dotenv/config";
import { defineConfig } from "drizzle-kit";

declare const process: { env: Record<string, string | undefined> };

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Set DATABASE_URL in SilingScan-Backend/.env first.");
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl },
});
