/**
 * OCFitShit Database Schema
 * ========================
 *
 * This schema defines the database structure for the OCFitShit internal fitness competition
 * tracking application. The schema is designed to support gamification elements like levels,
 * badges, and team competitions while tracking individual and group fitness activities.
 *
 * Core Features:
 * -------------
 * - User Profiles & Teams: Track individual users and team groupings
 * - Exercise Tracking: Comprehensive exercise logging with difficulty levels
 * - Seasons & Challenges: Time-based competition periods
 * - Gamification: Levels, badges, and point systems
 * - Social Features: Team-based competitions and leaderboards
 *
 * Schema Organization:
 * ------------------
 * The schema is organized into several logical sections:
 *
 * 1. User & Team Core Models
 *    - User profiles with stats and progress
 *    - Team organization and membership
 *
 * 2. Seasons & Challenges
 *    - Time-based competition periods
 *    - Specific challenges within seasons
 *
 * 3. Exercise Domain
 *    - Exercise catalog and categorization
 *    - Exercise logging and tracking
 *    - Difficulty levels and muscle groups
 *
 * 4. Gamification Features
 *    - Level progression system
 *    - Achievement badges
 *    - Leaderboards
 *    - User notifications
 *
 * Key Relationships:
 * ----------------
 * - Users can belong to teams (many-to-many)
 * - Exercises are categorized by type and muscle groups (many-to-many)
 * - Challenges belong to seasons (one-to-many)
 * - Exercise logs link to users, exercises, and optionally challenges
 * - Badges and notifications are linked to users
 *
 * Points System:
 * -------------
 * - Users earn points through exercise completion
 * - Points contribute to individual and team levels
 * - Point calculations consider:
 *   * Exercise difficulty multipliers
 *   * Challenge multipliers
 *   * Season context
 *
 * Implementation Notes:
 * -------------------
 * - Uses Drizzle ORM with PostgreSQL
 * - UUID primary keys for most entities
 * - Timestamp tracking for all relevant entities
 * - Proper foreign key constraints with cascade/set null behaviors
 * - JSON fields for flexible metadata storage
 */

import { relations } from "drizzle-orm";
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

// ===============================
// 🔐 User & Team Core Models
// ===============================

/**
 * User profiles table - stores basic user information and stats
 * @property {string} userId - Primary key, maps to Clerk user ID
 * @property {string} displayName - User's display name
 * @property {string} avatarUrl - URL to user's profile picture
 * @property {number} level - Current user level (references levelRequirements)
 * @property {number} totalPoints - All-time accumulated points
 * @property {number} currentPoints - Points in current season/challenge
 * @property {number} teamPoints - Points contributed to team
 * @property {Date} createdAt - Timestamp of profile creation
 */
export const userProfiles = pgTable("user_profiles", {
    userId: text("user_id").primaryKey(),
    displayName: text("display_name"),
    avatarUrl: text("avatar_url"),
    level: integer("level").default(1).notNull().references(() => levelRequirements.level),
    totalPoints: integer("total_points").default(0).notNull(),
    currentPoints: integer("current_points").default(0).notNull(),
    teamPoints: integer("team_points").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Teams table - groups of users competing together
 * @property {string} id - UUID primary key
 * @property {string} name - Team name
 * @property {number} totalTeamPoints - Accumulated team points
 * @property {number} teamLevel - Current team level (references levelRequirements)
 * @property {Date} createdAt - Timestamp of team creation
 */
export const teams = pgTable("teams", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    totalTeamPoints: integer("total_team_points").default(0).notNull(),
    teamLevel: integer("team_level").default(1).notNull().references(() => levelRequirements.level),
    createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Team members junction table - maps users to teams
 * @property {string} teamId - Reference to teams table (cascade delete)
 * @property {string} userId - Reference to user_profiles table (cascade delete)
 * @property {Date} joinedAt - Timestamp when user joined team
 */
export const teamMembers = pgTable("team_members", {
    teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => userProfiles.userId, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").defaultNow(),
});

// ===============================
// 📆 Seasons & Challenges
// ===============================

/**
 * Seasons table - major competition periods
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
 * Challenges table - specific competitions within seasons
 * @property {string} id - UUID primary key
 * @property {string} seasonId - Reference to seasons table
 * @property {string} name - Challenge name
 * @property {string} description - Challenge description
 * @property {Date} startsAt - Challenge start date
 * @property {Date} endsAt - Challenge end date
 * @property {boolean} isTeamBased - Whether challenge is team-based
 * @property {number} pointsMultiplier - Multiplier for points earned in this challenge
 */
export const challenges = pgTable("challenges", {
    id: uuid("id").primaryKey().defaultRandom(),
    seasonId: uuid("season_id").notNull().references(() => seasons.id),
    name: text("name").notNull(),
    description: text("description"),
    startsAt: timestamp("starts_at"),
    endsAt: timestamp("ends_at"),
    isTeamBased: boolean("is_team_based").default(false),
    pointsMultiplier: integer("points_multiplier").default(1),
});

// ===============================
// 🏋️‍♂️ Exercise Domain
// ===============================

/**
 * Exercise difficulties table - defines difficulty levels
 * @property {number} id - Serial primary key
 * @property {string} label - Difficulty label (e.g., "Beginner", "Advanced")
 */
export const exerciseDifficulties = pgTable("exercise_difficulties", {
    id: serial("id").primaryKey(),
    label: text("label").notNull(),
});

/**
 * Muscle groups table - defines target muscle areas
 * @property {number} id - Serial primary key
 * @property {string} name - Muscle group name (e.g., "Chest", "Back")
 */
export const muscleGroups = pgTable("muscle_groups", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
});

/**
 * Exercise categories table - defines exercise types
 * @property {number} id - Serial primary key
 * @property {string} name - Category name (e.g., "Strength", "Cardio")
 */
export const exerciseCategories = pgTable("exercise_categories", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
});

/**
 * Exercise catalog table - master data for exercises
 * @property {string} id - UUID primary key
 * @property {string} name - Exercise name
 * @property {string} description - Exercise description
 * @property {string} equipment - Required equipment (JSON array)
 * @property {number} difficultyId - Reference to exercise_difficulties
 * @property {Date} createdAt - Timestamp of creation
 */
export const exerciseCatalog = pgTable("exercise_catalog", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    equipment: text("equipment"),
    difficultyId: integer("difficulty_id").references(() => exerciseDifficulties.id),
    createdAt: timestamp("created_at").defaultNow(),
});

/**
 * Exercise category links - maps exercises to categories
 * @property {string} exerciseId - Reference to exercise_catalog (cascade delete)
 * @property {number} categoryId - Reference to exercise_categories (cascade delete)
 */
export const exerciseCategoryLinks = pgTable("exercise_category_links", {
    exerciseId: uuid("exercise_id").notNull().references(() => exerciseCatalog.id, { onDelete: "cascade" }),
    categoryId: integer("category_id").notNull().references(() => exerciseCategories.id, { onDelete: "cascade" }),
}, (t) => ({
    pk: [t.exerciseId, t.categoryId],
}));

/**
 * Exercise muscle links - maps exercises to muscle groups
 * @property {string} exerciseId - Reference to exercise_catalog (cascade delete)
 * @property {number} muscleGroupId - Reference to muscle_groups (cascade delete)
 */
export const exerciseMuscleLinks = pgTable("exercise_muscle_links", {
    exerciseId: uuid("exercise_id").notNull().references(() => exerciseCatalog.id, { onDelete: "cascade" }),
    muscleGroupId: integer("muscle_group_id").notNull().references(() => muscleGroups.id, { onDelete: "cascade" }),
}, (t) => ({
    pk: [t.exerciseId, t.muscleGroupId],
}));

/**
 * Exercise logs table - records of completed exercises
 * @property {string} id - UUID primary key
 * @property {string} userId - Reference to user_profiles (cascade delete)
 * @property {string} challengeId - Optional reference to challenges (set null on delete)
 * @property {string} exerciseId - Reference to exercise_catalog (cascade delete)
 * @property {number} quantity - Amount of exercise performed
 * @property {string} unit - Unit of measurement
 * @property {number} sets - Number of sets completed
 * @property {number} weight - Weight used (if applicable)
 * @property {number} duration - Duration in seconds
 * @property {number} calories - Calories burned
 * @property {number} difficultyMultiplier - Points multiplier based on difficulty
 * @property {number} points - Points earned for this exercise
 * @property {Object} metadata - Additional exercise data
 * @property {Date} createdAt - Timestamp of log creation
 */
export const exerciseLogs = pgTable("exercise_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => userProfiles.userId, { onDelete: "cascade" }),
    challengeId: uuid("challenge_id").references(() => challenges.id, { onDelete: "set null" }),
    exerciseId: uuid("exercise_id").notNull().references(() => exerciseCatalog.id, { onDelete: "cascade" }),
    quantity: integer("quantity"),
    unit: text("unit"),
    sets: integer("sets"),
    weight: integer("weight"),
    duration: integer("duration"),
    calories: integer("calories"),
    difficultyMultiplier: integer("difficulty_multiplier").default(1),
    points: integer("points").default(0).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow(),
});

// ===============================
// 🏅 Leveling, Badges, Leaderboards, Notifications
// ===============================

/**
 * Level requirements table - defines progression system
 * @property {number} level - Primary key, level number
 * @property {number} pointsRequired - Points needed to reach this level
 * @property {string} description - Level description
 * @property {Object} rewards - JSON object containing level rewards
 */
export const levelRequirements = pgTable("level_requirements", {
    level: integer("level").primaryKey(),
    pointsRequired: integer("points_required").notNull(),
    description: text("description"),
    rewards: jsonb("rewards"),
});

/**
 * Badges table - achievements earned by users
 * @property {string} id - UUID primary key
 * @property {string} userId - Reference to user_profiles (cascade delete)
 * @property {string} type - Badge type
 * @property {string} label - Badge display name
 * @property {number} levelRequirement - Optional level requirement reference
 * @property {Date} awardedAt - Timestamp when badge was awarded
 */
export const badges = pgTable("badges", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => userProfiles.userId, { onDelete: "cascade" }),
    type: text("type").notNull(),
    label: text("label").notNull(),
    levelRequirement: integer("level_requirement").references(() => levelRequirements.level),
    awardedAt: timestamp("awarded_at").defaultNow(),
});

/**
 * Leaderboards table - precomputed rankings
 * @property {number} id - Serial primary key
 * @property {string} userId - Reference to user_profiles (cascade delete)
 * @property {string} seasonId - Optional reference to seasons
 * @property {string} challengeId - Optional reference to challenges
 * @property {number} rank - User's position
 * @property {number} points - Points for this leaderboard entry
 * @property {Date} calculatedAt - Timestamp of last calculation
 */
export const leaderboards = pgTable("leaderboards", {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().references(() => userProfiles.userId, { onDelete: "cascade" }),
    seasonId: uuid("season_id").references(() => seasons.id),
    challengeId: uuid("challenge_id").references(() => challenges.id),
    rank: integer("rank"),
    points: integer("points"),
    calculatedAt: timestamp("calculated_at").defaultNow(),
});

/**
 * Notifications table - system messages for users
 * @property {string} id - UUID primary key
 * @property {string} userId - Reference to user_profiles (cascade delete)
 * @property {string} type - Notification type
 * @property {string} message - Notification content
 * @property {boolean} isRead - Whether notification has been read
 * @property {Date} createdAt - Timestamp of notification creation
 */
export const notifications = pgTable("notifications", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => userProfiles.userId, { onDelete: "cascade" }),
    type: text("type"),
    message: text("message"),
    isRead: boolean("is_read").default(false),
    createdAt: timestamp("created_at").defaultNow(),
});

// ===============================
// 🧩 Relations
// ===============================

/**
 * User profile relations
 * - One-to-many: exercise logs, team memberships, badges, leaderboard entries, notifications
 * - One-to-one: current level requirement
 */
export const userProfilesRelations = relations(userProfiles, ({ many, one }) => ({
    exerciseLogs: many(exerciseLogs),
    teamMembers: many(teamMembers),
    badges: many(badges),
    leaderboards: many(leaderboards),
    notifications: many(notifications),
    level: one(levelRequirements, {
        fields: [userProfiles.level],
        references: [levelRequirements.level],
    }),
}));

/**
 * Team relations
 * - One-to-many: team members
 * - One-to-one: current level requirement
 */
export const teamsRelations = relations(teams, ({ many, one }) => ({
    members: many(teamMembers),
    level: one(levelRequirements, {
        fields: [teams.teamLevel],
        references: [levelRequirements.level],
    }),
}));

/**
 * Team member relations
 * - One-to-one: team and user profile
 */
export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
    team: one(teams, {
        fields: [teamMembers.teamId],
        references: [teams.id],
    }),
    user: one(userProfiles, {
        fields: [teamMembers.userId],
        references: [userProfiles.userId],
    }),
}));

/**
 * Season relations
 * - One-to-many: challenges
 */
export const seasonsRelations = relations(seasons, ({ many }) => ({
    challenges: many(challenges),
}));

/**
 * Challenge relations
 * - One-to-one: season
 * - One-to-many: exercise logs
 */
export const challengesRelations = relations(challenges, ({ one, many }) => ({
    season: one(seasons, {
        fields: [challenges.seasonId],
        references: [seasons.id],
    }),
    exerciseLogs: many(exerciseLogs),
}));

/**
 * Exercise catalog relations
 * - One-to-many: category links, muscle group links, exercise logs
 * - One-to-one: difficulty level
 */
export const exerciseCatalogRelations = relations(exerciseCatalog, ({ many, one }) => ({
    categories: many(exerciseCategoryLinks),
    muscleGroups: many(exerciseMuscleLinks),
    logs: many(exerciseLogs),
    difficulty: one(exerciseDifficulties, {
        fields: [exerciseCatalog.difficultyId],
        references: [exerciseDifficulties.id],
    }),
}));

/**
 * Exercise category relations
 * - One-to-many: exercise links
 */
export const exerciseCategoryRelations = relations(exerciseCategories, ({ many }) => ({
    exercises: many(exerciseCategoryLinks),
}));

/**
 * Muscle group relations
 * - One-to-many: exercise links
 */
export const muscleGroupRelations = relations(muscleGroups, ({ many }) => ({
    exercises: many(exerciseMuscleLinks),
}));

/**
 * Exercise category link relations
 * - One-to-one: exercise and category
 */
export const exerciseCategoryLinksRelations = relations(exerciseCategoryLinks, ({ one }) => ({
    exercise: one(exerciseCatalog, {
        fields: [exerciseCategoryLinks.exerciseId],
        references: [exerciseCatalog.id],
    }),
    category: one(exerciseCategories, {
        fields: [exerciseCategoryLinks.categoryId],
        references: [exerciseCategories.id],
    }),
}));

/**
 * Exercise muscle link relations
 * - One-to-one: exercise and muscle group
 */
export const exerciseMuscleLinksRelations = relations(exerciseMuscleLinks, ({ one }) => ({
    exercise: one(exerciseCatalog, {
        fields: [exerciseMuscleLinks.exerciseId],
        references: [exerciseCatalog.id],
    }),
    muscleGroup: one(muscleGroups, {
        fields: [exerciseMuscleLinks.muscleGroupId],
        references: [muscleGroups.id],
    }),
}));

/**
 * Exercise log relations
 * - One-to-one: exercise catalog entry, user profile, and challenge
 */
export const exerciseLogRelations = relations(exerciseLogs, ({ one }) => ({
    exercise: one(exerciseCatalog, {
        fields: [exerciseLogs.exerciseId],
        references: [exerciseCatalog.id],
    }),
    user: one(userProfiles, {
        fields: [exerciseLogs.userId],
        references: [userProfiles.userId],
    }),
    challenge: one(challenges, {
        fields: [exerciseLogs.challengeId],
        references: [challenges.id],
    }),
}));

/**
 * Badge relations
 * - One-to-one: user profile and level requirement
 */
export const badgesRelations = relations(badges, ({ one }) => ({
    user: one(userProfiles, {
        fields: [badges.userId],
        references: [userProfiles.userId],
    }),
    levelRequirement: one(levelRequirements, {
        fields: [badges.levelRequirement],
        references: [levelRequirements.level],
    }),
}));

/**
 * Leaderboard relations
 * - One-to-one: user profile, season, and challenge
 */
export const leaderboardsRelations = relations(leaderboards, ({ one }) => ({
    user: one(userProfiles, {
        fields: [leaderboards.userId],
        references: [userProfiles.userId],
    }),
    season: one(seasons, {
        fields: [leaderboards.seasonId],
        references: [seasons.id],
    }),
    challenge: one(challenges, {
        fields: [leaderboards.challengeId],
        references: [challenges.id],
    }),
}));

/**
 * Notification relations
 * - One-to-one: user profile
 */
export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(userProfiles, {
        fields: [notifications.userId],
        references: [userProfiles.userId],
    }),
}));
