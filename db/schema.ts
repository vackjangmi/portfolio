import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const links = sqliteTable("links", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  targetUrl: text("target_url").notNull(),
  title: text("title").notNull().default(""),
  clickCount: integer("click_count").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
