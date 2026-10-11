import {
  index,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./auth.js";

export const scans = pgTable(
  "scans",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    imageData: text("image_data").notNull(),
    status: varchar("status", { length: 20 }).notNull(),
    confidence: real("confidence").notNull(),
    summary: text("summary").notNull(),
    urgency: varchar("urgency", { length: 100 }).notNull(),
    recommendations: jsonb("recommendations").$type<string[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("scans_user_created_idx").on(table.userId, table.createdAt)],
);
