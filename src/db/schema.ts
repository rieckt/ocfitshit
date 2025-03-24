import {
    boolean,
    integer,
    jsonb,
    pgTable,
    serial,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

/**
 * User profiles table - stores basic user information from Clerk
 * @property {string} userId - Primary key, maps to Clerk user ID
 * @property {string} displayName - User's display name (first_name + last_name or email prefix)
 * @property {string} avatarUrl - URL to user's profile picture
 * @property {number} level - Current user level, starts at 1
 * @property {number} totalPoints - Accumulated points from all activities
 * @property {Date} createdAt - Timestamp of profile creation
 */
export const userProfiles = pgTable("user_profiles", {
	userId: text("user_id").primaryKey(), // Clerk ID
	displayName: text("display_name"),
	avatarUrl: text("avatar_url"),
	level: integer("level").default(1),
	totalPoints: integer("total_points").default(0),
	createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Teams table - groups of users for team-based competitions
 * @property {string} id - UUID primary key
 * @property {string} name - Team name
 * @property {Date} createdAt - Timestamp of team creation
 */
export const teams = pgTable("teams", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Team members junction table - maps users to teams
 * @property {string} teamId - Reference to teams table
 * @property {string} userId - Reference to user_profiles table
 * @property {Date} joinedAt - Timestamp when user joined team
 */
export const teamMembers = pgTable("team_members", {
	teamId: uuid("team_id").notNull(),
	userId: text("user_id").notNull(),
	joinedAt: timestamp("joined_at").defaultNow(),
});

/**
 * Seasons table - represents competition periods
 * @property {string} id - UUID primary key
 * @property {string} name - Season name
 * @property {Date} startsAt - Season start date
 * @property {Date} endsAt - Season end date
 * @property {boolean} isActive - Whether season is currently active
 * @property {Date} createdAt - Timestamp of season creation
 */
export const seasons = pgTable("seasons", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	startsAt: timestamp("starts_at").notNull(),
	endsAt: timestamp("ends_at").notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Challenges table - specific goals or competitions within a season
 * @property {string} id - UUID primary key
 * @property {string} seasonId - Reference to seasons table
 * @property {string} name - Challenge name
 * @property {string} description - Challenge description
 * @property {Date} startsAt - Challenge start date
 * @property {Date} endsAt - Challenge end date
 * @property {boolean} isTeamBased - Whether challenge is team-based
 */
export const challenges = pgTable("challenges", {
	id: uuid("id").primaryKey().defaultRandom(),
	seasonId: uuid("season_id").notNull(),
	name: text("name"),
	description: text("description"),
	startsAt: timestamp("starts_at"),
	endsAt: timestamp("ends_at"),
	isTeamBased: boolean("is_team_based").default(false),
});

/**
 * Exercise types table - defines available exercise categories
 * @property {number} id - Serial primary key
 * @property {string} name - Exercise type name (e.g., "running", "yoga")
 * @property {string} unit - Unit of measurement (e.g., "km", "minutes", "reps")
 */
export const exerciseTypes = pgTable("exercise_types", {
	id: serial("id").primaryKey(),
	name: text("name").notNull(),
	unit: text("unit"),
});

/**
 * Exercises table - logs of user activities
 * @property {string} id - UUID primary key
 * @property {string} userId - Reference to user_profiles table
 * @property {string} challengeId - Reference to challenges table
 * @property {number} exerciseTypeId - Reference to exercise_types table
 * @property {number} value - Amount of exercise (in units defined by exercise type)
 * @property {number} points - Points earned for this exercise
 * @property {Object} metadata - Additional exercise data (JSON)
 * @property {Date} createdAt - Timestamp of exercise log
 */
export const exercises = pgTable("exercises", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id").notNull(),
	challengeId: uuid("challenge_id").notNull(),
	exerciseTypeId: integer("exercise_type_id").notNull(),
	value: integer("value").notNull(),
	points: integer("points").default(0),
	metadata: jsonb("metadata"),
	createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Badges table - achievements earned by users
 * @property {string} id - UUID primary key
 * @property {string} userId - Reference to user_profiles table
 * @property {string} type - Badge type (e.g., "milestone", "top_rank")
 * @property {string} label - Badge display name
 * @property {Date} awardedAt - Timestamp when badge was awarded
 */
export const badges = pgTable("badges", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id").notNull(),
	type: text("type"),
	label: text("label"),
	awardedAt: timestamp("awarded_at").defaultNow(),
});

/**
 * Leaderboards table - precomputed rankings for seasons/challenges
 * @property {number} id - Serial primary key
 * @property {string} userId - Reference to user_profiles table
 * @property {string} seasonId - Optional reference to seasons table
 * @property {string} challengeId - Optional reference to challenges table
 * @property {number} rank - User's position in leaderboard
 * @property {number} points - Total points for this leaderboard entry
 * @property {Date} calculatedAt - Timestamp of last calculation
 */
export const leaderboards = pgTable("leaderboards", {
	id: serial("id").primaryKey(),
	userId: text("user_id").notNull(),
	seasonId: uuid("season_id"),
	challengeId: uuid("challenge_id"),
	rank: integer("rank"),
	points: integer("points"),
	calculatedAt: timestamp("calculated_at").defaultNow(),
});

/**
 * Notifications table - system messages for users
 * @property {string} id - UUID primary key
 * @property {string} userId - Reference to user_profiles table
 * @property {string} type - Notification type
 * @property {string} message - Notification content
 * @property {boolean} isRead - Whether notification has been read
 * @property {Date} createdAt - Timestamp of notification creation
 */
export const notifications = pgTable("notifications", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id").notNull(),
	type: text("type"),
	message: text("message"),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at").defaultNow(),
});
