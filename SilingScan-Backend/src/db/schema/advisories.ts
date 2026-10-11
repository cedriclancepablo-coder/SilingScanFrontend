import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./auth.js";

export const advisories = pgTable(
  "advisories",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    title: varchar("title", { length: 140 }).notNull(),
    category: varchar("category", { length: 24 }).notNull(),
    crop: varchar("crop", { length: 80 }).notNull(),
    body: text("body").notNull(),
    authorId: varchar("author_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("advisories_created_idx").on(table.createdAt)],
);
