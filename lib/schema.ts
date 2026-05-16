import { pgTable, serial, text, timestamp, boolean, integer, numeric, primaryKey } from "drizzle-orm/pg-core"

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  password_hash: text("password_hash"), // optional — SIWE-only users have no password
  bio: text("bio"),
  location: text("location"),
  website: text("website"),
  avatar_url: text("avatar_url"),
  wallet_address: text("wallet_address").unique(),
  is_verified: boolean("is_verified").default(false),
  verification_token: text("verification_token"),
  reset_token: text("reset_token"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
})

// Shouts table
export const shouts = pgTable("shouts", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  image_url: text("image_url"),
  vote_count: numeric("like_count", { precision: 78, scale: 0 }).default("0"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
})

// Likes table (weight_wei = staked SHOT at like time; shout total adds/subtracts this row)
export const likes = pgTable(
  "likes",
  {
    user_id: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    shout_id: integer("shout_id")
      .notNull()
      .references(() => shouts.id, { onDelete: "cascade" }),
    weight_wei: numeric("weight_wei", { precision: 78, scale: 0 }).default("0").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.user_id, table.shout_id] }),
    }
  },
)

// Follows table
export const follows = pgTable(
  "follows",
  {
    follower_id: integer("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    following_id: integer("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.follower_id, table.following_id] }),
    }
  },
)

// Reshouts table
export const reshouts = pgTable(
  "reshouts",
  {
    user_id: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    shout_id: integer("shout_id")
      .notNull()
      .references(() => shouts.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.user_id, table.shout_id] }),
    }
  },
)

// Comments table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  shout_id: integer("shout_id")
    .notNull()
    .references(() => shouts.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
})

// Hashtags table
export const hashtags = pgTable("hashtags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull(),
})

// Shout-Hashtags relationship table
export const shoutHashtags = pgTable(
  "shout_hashtags",
  {
    shout_id: integer("shout_id")
      .notNull()
      .references(() => shouts.id, { onDelete: "cascade" }),
    hashtag_id: integer("hashtag_id")
      .notNull()
      .references(() => hashtags.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.shout_id, table.hashtag_id] }),
    }
  },
)

// Moderation deletion audit (shout row removed; snapshot kept here)
export const shoutDeletions = pgTable("shout_deletions", {
  id: serial("id").primaryKey(),
  shout_id: integer("shout_id").notNull(),
  author_id: integer("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  deleted_by_id: integer("deleted_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull().default(""),
  image_url: text("image_url"),
  author_weight_at_deletion: numeric("author_weight_at_deletion", { precision: 78, scale: 0 })
    .default("0")
    .notNull(),
  deleter_weight_at_deletion: numeric("deleter_weight_at_deletion", { precision: 78, scale: 0 })
    .default("0")
    .notNull(),
  reason: text("reason").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
})

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  actor_id: integer("actor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // like, reshout, follow, comment, mention, message, shout_deleted
  shout_id: integer("shout_id").references(() => shouts.id, { onDelete: "cascade" }),
  comment_id: integer("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  shout_deletion_id: integer("shout_deletion_id").references(() => shoutDeletions.id, {
    onDelete: "set null",
  }),
  is_read: boolean("is_read").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
})

// Conversations table
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
})

// Conversation participants table
export const conversationParticipants = pgTable(
  "conversation_participants",
  {
    conversation_id: integer("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    user_id: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.conversation_id, table.user_id] }),
    }
  },
)

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversation_id: integer("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  sender_id: integer("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  is_read: boolean("is_read").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
})

// Bookmarks table
export const bookmarks = pgTable(
  "bookmarks",
  {
    user_id: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    shout_id: integer("shout_id")
      .notNull()
      .references(() => shouts.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.user_id, table.shout_id] }),
    }
  },
)
