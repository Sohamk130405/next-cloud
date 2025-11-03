import { text, timestamp, pgTable, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  clerkId: text("clerk_id").unique(),
  email: text("email").unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userKeys = pgTable("user_keys", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  salt: text("salt"),
  keyHash: text("key_hash"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const files = pgTable("files", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  driveFileId: text("drive_file_id"),
  iv: text("iv"),
  salt: text("salt"),
  authTag: text("auth_tag"),
  fileName: text("file_name"),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const googleTokens = pgTable("google_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shareLinks = pgTable("share_links", {
  id: text("id").primaryKey(),
  fileId: text("file_id")
    .references(() => files.id, { onDelete: "cascade" })
    .notNull(),
  ownerId: text("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  shareToken: text("share_token").notNull().unique(),
  expiresAt: timestamp("expires_at"),
  maxDownloads: integer("max_downloads"),
  downloadCount: integer("download_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shares = pgTable("shares", {
  id: text("id").primaryKey(),
  fileId: text("file_id")
    .references(() => files.id, { onDelete: "cascade" })
    .notNull(),
  ownerId: text("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  sharedWithId: text("shared_with_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  permission: text("permission").default("view"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  actionType: text("action_type").notNull(),
  fileId: text("file_id").references(() => files.id, { onDelete: "set null" }),
  shareId: text("share_id").references(() => shareLinks.id, {
    onDelete: "set null",
  }),
  description: text("description"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const storageStats = pgTable("storage_stats", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  totalFiles: integer("total_files").default(0),
  totalSize: integer("total_size").default(0),
  filesShared: integer("files_shared").default(0),
  recordedAt: timestamp("recorded_at").defaultNow(),
});
