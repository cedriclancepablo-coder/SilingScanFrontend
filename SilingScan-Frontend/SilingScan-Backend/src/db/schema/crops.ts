import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./auth.js";

export const crops = pgTable(
  "crops",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    variety: varchar("variety", { length: 100 }).notNull(),
    location: varchar("location", { length: 160 }).notNull(),
    plantedAt: timestamp("planted_at", { withTimezone: true }),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("crops_owner_idx").on(table.userId, table.createdAt)],
);
