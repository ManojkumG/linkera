import { relations, sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTableCreator,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

import {
  type EducationEntry,
  EXPERIENCE_LEVELS,
  type ParsedResume,
  type ProjectEntry,
  REQUEST_STATUSES,
  type StatusHistoryEntry,
  USER_ROLES,
  VERIFICATION_METHODS,
  VERIFICATION_STATUSES,
  WORK_MODES,
} from "~/lib/domain";

/**
 * Multi-project schema — every table is prefixed with `sharkhire_`.
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `sharkhire_${name}`);

// ---------------------------------------------------------------------------
// Enums (names are global in Postgres, so prefix them too)
// ---------------------------------------------------------------------------
export const userRoleEnum = pgEnum("sharkhire_user_role", USER_ROLES);
export const workModeEnum = pgEnum("sharkhire_work_mode", WORK_MODES);
export const experienceLevelEnum = pgEnum(
  "sharkhire_experience_level",
  EXPERIENCE_LEVELS,
);
export const verificationMethodEnum = pgEnum(
  "sharkhire_verification_method",
  VERIFICATION_METHODS,
);
export const verificationStatusEnum = pgEnum(
  "sharkhire_verification_status",
  VERIFICATION_STATUSES,
);
export const requestStatusEnum = pgEnum(
  "sharkhire_request_status",
  REQUEST_STATUSES,
);

// ---------------------------------------------------------------------------
// Auth tables (NextAuth Drizzle adapter shape) + app columns
// ---------------------------------------------------------------------------
export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d
    .timestamp({ mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`),
  image: d.varchar({ length: 255 }),
  // App-specific
  role: userRoleEnum("role").notNull().default("seeker"),
  passwordHash: d.varchar({ length: 255 }),
  onboardedAt: d.timestamp({ withTimezone: true }),
  createdAt: d
    .timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  accounts: many(accounts),
  employeeProfile: one(employeeProfiles, {
    fields: [users.id],
    references: [employeeProfiles.userId],
  }),
  seekerProfile: one(seekerProfiles, {
    fields: [users.id],
    references: [seekerProfiles.userId],
  }),
  resumes: many(resumes),
  notifications: many(notifications),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ---------------------------------------------------------------------------
// Employee (referrer) profiles
// ---------------------------------------------------------------------------
export const employeeProfiles = createTable(
  "employee_profile",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    company: d.varchar({ length: 255 }).notNull(),
    companyDomain: d.varchar({ length: 255 }),
    department: d.varchar({ length: 255 }),
    title: d.varchar({ length: 255 }),
    location: d.varchar({ length: 255 }),
    workMode: workModeEnum("work_mode").default("onsite"),
    experienceLevel: experienceLevelEnum("experience_level").default("mid"),
    yearsExperience: d.integer().default(0),
    bio: d.text(),
    linkedinUrl: d.varchar({ length: 512 }),
    verificationMethod: verificationMethodEnum("verification_method"),
    verificationStatus: verificationStatusEnum("verification_status")
      .notNull()
      .default("unverified"),
    verifiedAt: d.timestamp({ withTimezone: true }),
    // Reputation (denormalized aggregates, recomputed on review/request events)
    avgResponseHours: d.integer(),
    ratingSum: d.integer().notNull().default(0),
    ratingCount: d.integer().notNull().default(0),
    totalReferred: d.integer().notNull().default(0),
    totalHired: d.integer().notNull().default(0),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    uniqueIndex("employee_profile_user_id_idx").on(t.userId),
    index("employee_profile_company_idx").on(t.company),
  ],
);

export const employeeProfilesRelations = relations(
  employeeProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [employeeProfiles.userId],
      references: [users.id],
    }),
    listings: many(referralListings),
  }),
);

// ---------------------------------------------------------------------------
// Seeker profiles
// ---------------------------------------------------------------------------
export const seekerProfiles = createTable(
  "seeker_profile",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    headline: d.varchar({ length: 255 }),
    location: d.varchar({ length: 255 }),
    workModePreference: workModeEnum("work_mode_preference"),
    experienceLevel: experienceLevelEnum("experience_level").default("entry"),
    yearsExperience: d.integer().default(0),
    skills: d.jsonb().$type<string[]>().default([]),
    education: d.jsonb().$type<EducationEntry[]>().default([]),
    certifications: d.jsonb().$type<string[]>().default([]),
    projects: d.jsonb().$type<ProjectEntry[]>().default([]),
    careerGoals: d.text(),
    targetCompanies: d.jsonb().$type<string[]>().default([]),
    openToRelocate: d.boolean().default(false),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [uniqueIndex("seeker_profile_user_id_idx").on(t.userId)],
);

export const seekerProfilesRelations = relations(seekerProfiles, ({ one }) => ({
  user: one(users, {
    fields: [seekerProfiles.userId],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// Resumes
// ---------------------------------------------------------------------------
export const resumes = createTable(
  "resume",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    fileName: d.varchar({ length: 512 }).notNull(),
    mimeType: d.varchar({ length: 128 }),
    // Extracted plain text of the resume (used by the AI parsing service).
    content: d.text(),
    parsed: d.jsonb().$type<ParsedResume>(),
    atsScore: d.integer(),
    isPrimary: d.boolean().notNull().default(false),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [index("resume_user_id_idx").on(t.userId)],
);

export const resumesRelations = relations(resumes, ({ one }) => ({
  user: one(users, { fields: [resumes.userId], references: [users.id] }),
}));

// ---------------------------------------------------------------------------
// Referral listings (what an employee offers)
// ---------------------------------------------------------------------------
export const referralListings = createTable(
  "referral_listing",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    employeeId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    company: d.varchar({ length: 255 }).notNull(),
    department: d.varchar({ length: 255 }),
    role: d.varchar({ length: 255 }).notNull(),
    jobTitle: d.varchar({ length: 255 }),
    location: d.varchar({ length: 255 }),
    workMode: workModeEnum("work_mode").default("onsite"),
    experienceLevel: experienceLevelEnum("experience_level").default("mid"),
    description: d.text(),
    skills: d.jsonb().$type<string[]>().default([]),
    // Price in the smallest currency unit is overkill for INR whole rupees; store rupees.
    priceInr: d.integer().notNull().default(0),
    monthlyLimit: d.integer().notNull().default(5),
    slotsUsedThisMonth: d.integer().notNull().default(0),
    slotsResetAt: d.timestamp({ withTimezone: true }),
    isActive: d.boolean().notNull().default(true),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("referral_listing_employee_idx").on(t.employeeId),
    index("referral_listing_company_idx").on(t.company),
    index("referral_listing_active_idx").on(t.isActive),
  ],
);

export const referralListingsRelations = relations(
  referralListings,
  ({ one, many }) => ({
    employee: one(users, {
      fields: [referralListings.employeeId],
      references: [users.id],
    }),
    requests: many(referralRequests),
  }),
);

// ---------------------------------------------------------------------------
// Referral requests (a seeker asking for a referral against a listing)
// ---------------------------------------------------------------------------
export const referralRequests = createTable(
  "referral_request",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    listingId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => referralListings.id),
    seekerId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    // Denormalized for cheap "requests I received" queries.
    employeeId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    resumeId: d.varchar({ length: 255 }).references(() => resumes.id),
    status: requestStatusEnum("status").notNull().default("requested"),
    message: d.text(),
    coverLetter: d.text(),
    priceInr: d.integer().notNull().default(0),
    paid: d.boolean().notNull().default(false),
    successScore: d.integer(),
    statusHistory: d
      .jsonb()
      .$type<StatusHistoryEntry[]>()
      .default([]),
    viewedAt: d.timestamp({ withTimezone: true }),
    referredAt: d.timestamp({ withTimezone: true }),
    decidedAt: d.timestamp({ withTimezone: true }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("referral_request_seeker_idx").on(t.seekerId),
    index("referral_request_employee_idx").on(t.employeeId),
    index("referral_request_listing_idx").on(t.listingId),
    index("referral_request_status_idx").on(t.status),
  ],
);

export const referralRequestsRelations = relations(
  referralRequests,
  ({ one }) => ({
    listing: one(referralListings, {
      fields: [referralRequests.listingId],
      references: [referralListings.id],
    }),
    seeker: one(users, {
      fields: [referralRequests.seekerId],
      references: [users.id],
    }),
    employee: one(users, {
      fields: [referralRequests.employeeId],
      references: [users.id],
    }),
    resume: one(resumes, {
      fields: [referralRequests.resumeId],
      references: [resumes.id],
    }),
  }),
);

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export const notifications = createTable(
  "notification",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 64 }).notNull(),
    title: d.varchar({ length: 255 }).notNull(),
    body: d.text(),
    link: d.varchar({ length: 512 }),
    isRead: d.boolean().notNull().default(false),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [index("notification_user_idx").on(t.userId, t.isRead)],
);

// ---------------------------------------------------------------------------
// Reviews (seeker rates the employee after a completed referral)
// ---------------------------------------------------------------------------
export const reviews = createTable(
  "review",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    requestId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => referralRequests.id),
    authorId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    employeeId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    rating: d.integer().notNull(),
    comment: d.text(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [
    uniqueIndex("review_request_idx").on(t.requestId),
    index("review_employee_idx").on(t.employeeId),
  ],
);
