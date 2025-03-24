# Fitness App Database Schema

## Overview

This database schema powers a fitness application with gamification features to enhance user engagement. It supports tracking user exercises, team collaboration, seasonal challenges, and a leveling system with badges and leaderboards. The schema is implemented in PostgreSQL and uses Drizzle ORM for defining tables and relationships.

### Key Features

- **User Profiles**: Track user progress, levels, and points.
- **Teams**: Enable collaborative goals and team-based leveling.
- **Seasons & Challenges**: Provide time-bound objectives with rewards.
- **Exercise Tracking**: Log workouts with a detailed exercise catalog.
- **Gamification**: Include levels, badges, leaderboards, and notifications.

## Main Entities

- **Users (`user_profiles`)**: Core entity storing user data and progress.
- **Teams (`teams`)**: Groups for collective challenges and points.
- **Seasons (`seasons`)**: Time periods with associated challenges.
- **Challenges (`challenges`)**: Goals for users or teams to achieve.
- **Exercises (`exercise_catalog`)**: Repository of exercises with metadata.
- **Exercise Logs (`exercise_logs`)**: Records of user workouts.
- **Badges (`badges`)**: Awards for achievements.
- **Leaderboards (`leaderboards`)**: Rankings based on performance.
- **Notifications (`notifications`)**: Alerts for user events.
- **Level Requirements (`level_requirements`)**: Rules for leveling up.

## Table Documentation

### `user_profiles`

- **Purpose**: Stores user information and gamification progress.
- **Columns**:
  - `userId`: `text`, primary key - Unique user identifier.
  - `displayName`: `text` - User’s display name.
  - `avatarUrl`: `text` - URL to user’s avatar.
  - `level`: `integer`, default 1 - References `level_requirements.level`.
  - `totalPoints`: `integer`, default 0 - Cumulative points earned.
  - `currentPoints`: `integer`, default 0 - Points towards next level.
  - `teamPoints`: `integer`, default 0 - Points from team activities.
  - `createdAt`: `timestamp`, default `now()` - Creation timestamp.
- **Relationships**:
  - Has many `exercise_logs`, `team_members`, `badges`, `leaderboards`, `notifications`.
  - Belongs to one `level_requirements` via `level`.

### `teams`

- **Purpose**: Represents teams for collaborative efforts.
- **Columns**:
  - `id`: `uuid`, primary key - Unique team identifier.
  - `name`: `text`, not null - Team name.
  - `totalTeamPoints`: `integer`, default 0 - Total team points.
  - `teamLevel`: `integer`, default 1 - References `level_requirements.level`.
  - `createdAt`: `timestamp`, default `now()` - Creation timestamp.
- **Relationships**:
  - Has many `team_members`.
  - Belongs to one `level_requirements` via `teamLevel`.

### `team_members`

- **Purpose**: Links users to teams.
- **Columns**:
  - `teamId`: `uuid` - References `teams.id`.
  - `userId`: `text` - References `user_profiles.userId`.
  - `joinedAt`: `timestamp`, default `now()` - Join timestamp.
- **Relationships**:
  - Belongs to one `teams` and one `user_profiles`.

### `seasons`

- **Purpose**: Defines periods with specific challenges.
- **Columns**:
  - `id`: `uuid`, primary key - Unique season identifier.
  - `name`: `text`, not null - Season name.
  - `startsAt`: `timestamp`, not null - Start time.
  - `endsAt`: `timestamp`, not null - End time.
  - `isActive`: `boolean`, default true - Active status.
  - `createdAt`: `timestamp`, default `now()` - Creation timestamp.
- **Relationships**:
  - Has many `challenges`.

### `challenges`

- **Purpose**: Goals for users or teams.
- **Columns**:
  - `id`: `uuid`, primary key - Unique challenge identifier.
  - `seasonId`: `uuid` - References `seasons.id`.
  - `name`: `text`, not null - Challenge name.
  - `description`: `text` - Challenge details.
  - `startsAt`: `timestamp` - Start time.
  - `endsAt`: `timestamp` - End time.
  - `isTeamBased`: `boolean`, default false - Team or individual challenge.
  - `pointsMultiplier`: `integer`, default 1 - Bonus points factor.
- **Relationships**:
  - Belongs to one `seasons`.
  - Has many `exercise_logs`.

### `exercise_difficulties`

- **Purpose**: Defines exercise difficulty levels.
- **Columns**:
  - `id`: `serial`, primary key - Unique identifier.
  - `label`: `text`, not null - e.g., "Beginner", "Intermediate".

### `muscle_groups`

- **Purpose**: Categories of muscles targeted by exercises.
- **Columns**:
  - `id`: `serial`, primary key - Unique identifier.
  - `name`: `text`, not null - Muscle group name.

### `exercise_categories`

- **Purpose**: Classifies exercises into categories.
- **Columns**:
  - `id`: `serial`, primary key - Unique identifier.
  - `name`: `text`, not null - Category name.

### `exercise_catalog`

- **Purpose**: Stores available exercises.
- **Columns**:
  - `id`: `uuid`, primary key - Unique exercise identifier.
  - `name`: `text`, not null - Exercise name.
  - `description`: `text` - Exercise details.
  - `equipment`: `text` - Required equipment.
  - `difficultyId`: `integer` - References `exercise_difficulties.id`.
  - `createdAt`: `timestamp`, default `now()` - Creation timestamp.
- **Relationships**:
  - Has many `exercise_category_links`, `exercise_muscle_links`, `exercise_logs`.
  - Belongs to one `exercise_difficulties`.

### `exercise_category_links`

- **Purpose**: Links exercises to categories.
- **Columns**:
  - `exerciseId`: `uuid` - References `exercise_catalog.id`.
  - `categoryId`: `integer` - References `exercise_categories.id`.
- **Relationships**:
  - Belongs to one `exercise_catalog` and one `exercise_categories`.

### `exercise_muscle_links`

- **Purpose**: Links exercises to muscle groups.
- **Columns**:
  - `exerciseId`: `uuid` - References `exercise_catalog.id`.
  - `muscleGroupId`: `integer` - References `muscle_groups.id`.
- **Relationships**:
  - Belongs to one `exercise_catalog` and one `muscle_groups`.

### `exercise_logs`

- **Purpose**: Records user workout activities.
- **Columns**:
  - `id`: `uuid`, primary key - Unique log identifier.
  - `userId`: `text` - References `user_profiles.userId`.
  - `challengeId`: `uuid` - References `challenges.id` (optional).
  - `exerciseId`: `uuid` - References `exercise_catalog.id`.
  - `quantity`: `integer` - Number of reps or units.
  - `unit`: `text` - Unit type (e.g., "reps", "minutes").
  - `sets`: `integer` - Number of sets.
  - `weight`: `integer` - Weight used (if applicable).
  - `duration`: `integer` - Duration in seconds.
  - `calories`: `integer` - Calories burned.
  - `difficultyMultiplier`: `integer`, default 1 - Points multiplier.
  - `points`: `integer`, default 0 - Points earned.
  - `metadata`: `jsonb` - Additional data.
  - `createdAt`: `timestamp`, default `now()` - Log timestamp.
- **Relationships**:
  - Belongs to one `user_profiles`, `challenges` (optional), `exercise_catalog`.

### `level_requirements`

- **Purpose**: Defines leveling thresholds and rewards.
- **Columns**:
  - `level`: `integer`, primary key - Level number.
  - `pointsRequired`: `integer`, not null - Points needed.
  - `description`: `text` - Level description.
  - `rewards`: `jsonb` - Rewards data (e.g., badges).
- **Relationships**:
  - Referenced by `user_profiles.level` and `teams.teamLevel`.

### `badges`

- **Purpose**: Tracks user achievements.
- **Columns**:
  - `id`: `uuid`, primary key - Unique badge identifier.
  - `userId`: `text` - References `user_profiles.userId`.
  - `type`: `text`, not null - Badge type.
  - `label`: `text`, not null - Badge name.
  - `levelRequirement`: `integer` - References `level_requirements.level` (optional).
  - `awardedAt`: `timestamp`, default `now()` - Award timestamp.
- **Relationships**:
  - Belongs to one `user_profiles` and one `level_requirements` (optional).

### `leaderboards`

- **Purpose**: Ranks users based on performance.
- **Columns**:
  - `id`: `serial`, primary key - Unique identifier.
  - `userId`: `text` - References `user_profiles.userId`.
  - `seasonId`: `uuid` - References `seasons.id` (optional).
  - `challengeId`: `uuid` - References `challenges.id` (optional).
  - `rank`: `integer` - User’s rank.
  - `points`: `integer` - Points for ranking.
  - `calculatedAt`: `timestamp`, default `now()` - Calculation timestamp.
- **Relationships**:
  - Belongs to one `user_profiles`, `seasons` (optional), `challenges` (optional).

### `notifications`

- **Purpose**: Sends messages to users.
- **Columns**:
  - `id`: `uuid`, primary key - Unique identifier.
  - `userId`: `text` - References `user_profiles.userId`.
  - `type`: `text` - Notification type.
  - `message`: `text` - Notification content.
  - `isRead`: `boolean`, default false - Read status.
  - `createdAt`: `timestamp`, default `now()` - Creation timestamp.
- **Relationships**:
  - Belongs to one `user_profiles`.

## Gamification Elements

### Leveling System

- Users and teams start at level 1 and progress by earning points.
- `level_requirements` specifies `pointsRequired` for each level.
- When `currentPoints` exceed the threshold, the user levels up, resetting `currentPoints`.
- Rewards (e.g., badges) are stored in `level_requirements.rewards`.

### Points Calculation

- Points are earned via `exercise_logs.points`.
- Calculated using exercise metrics (e.g., `quantity`, `weight`) and multipliers (`difficultyMultiplier`, `challenges.pointsMultiplier`).

### Badges

- Awarded for milestones, such as reaching a level or completing challenges.
- Linked to `level_requirements` for level-based badges.

### Teams

- Users join via `team_members`, contributing to `totalTeamPoints`.
- Teams level up similarly to users, using `teamLevel`.

### Challenges

- Defined in `challenges`, tied to `seasons`.
- Offer bonus points via `pointsMultiplier`.
