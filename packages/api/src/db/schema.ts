import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "patient",
  "caregiver",
  "community_health_worker",
  "nurse",
  "doctor",
  "specialist",
  "facility_administrator",
  "medical_reviewer"
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("patient"),
  locale: varchar("locale", { length: 10 }).notNull().default("en"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [index("refresh_tokens_user_idx").on(t.userId)]
);

export const passwordResets = pgTable(
  "password_resets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [index("password_resets_user_idx").on(t.userId)]
);

export const reviewStatusEnum = pgEnum("review_status", ["pending", "approved", "declined", "shared"]);

export const conversationStatusEnum = pgEnum("conversation_status", [
  "active",
  "paused",
  "completed"
]);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    symptomText: text("symptom_text").notNull(),
    intakeMode: text("intake_mode").notNull().default("typed"),
    status: conversationStatusEnum("status").notNull().default("active"),
    categoryIds: jsonb("category_ids").notNull(),
    possibleCauses: jsonb("possible_causes").notNull(),
    urgency: text("urgency").notNull().default("routine"),
    isEmergency: boolean("is_emergency").notNull().default(false),
    notes: jsonb("notes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [index("conversations_patient_idx").on(t.patientId)]
);

export const reminderStatusEnum = pgEnum("reminder_status", [
  "active",
  "paused",
  "completed",
  "cancelled"
]);

export const reminders = pgTable(
  "reminders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").references(() => conversations.id, {
      onDelete: "set null"
    }),
    label: text("label").notNull(),
    instructions: text("instructions").notNull(),
    intervalDays: integer("interval_days").notNull().default(1),
    nextDueAt: timestamp("next_due_at", { withTimezone: true }).notNull(),
    status: reminderStatusEnum("status").notNull().default("active"),
    escalationNote: text("escalation_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [
    index("reminders_patient_idx").on(t.patientId),
    index("reminders_due_idx").on(t.nextDueAt)
  ]
);

export const healthDocuments = pgTable(
  "health_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    documentType: text("document_type").notNull(),
    rawText: text("raw_text").notNull(),
    explanation: jsonb("explanation").notNull(),
    clarifyItems: jsonb("clarify_items").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [index("health_documents_patient_idx").on(t.patientId)]
);

export const reviewRequests = pgTable(
  "review_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    symptomText: text("symptom_text").notNull(),
    summary: text("summary").notNull(),
    possibleCauses: jsonb("possible_causes").notNull(),
    urgency: text("urgency").notNull().default("routine"),
    status: reviewStatusEnum("status").notNull().default("pending"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [index("review_requests_patient_idx").on(t.patientId)]
);

export const facilities = pgTable("facilities", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  capability: text("capability").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  openHours: text("open_hours"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull()
});

export const patientProfiles = pgTable(
  "patient_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: uuid("patient_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    dateOfBirth: varchar("date_of_birth", { length: 10 }),
    bloodType: varchar("blood_type", { length: 5 }),
    emergencyContactName: text("emergency_contact_name"),
    emergencyContactPhone: text("emergency_contact_phone"),
    emergencySummary: text("emergency_summary"),
    conditions: jsonb("conditions").$type<string[]>().notNull().default([]),
    medicines: jsonb("medicines").$type<string[]>().notNull().default([]),
    allergies: jsonb("allergies").$type<string[]>().notNull().default([]),
    emergencySummaryUpdatedAt: timestamp("emergency_summary_updated_at", { withTimezone: true }),
    shareLocation: boolean("share_location").notNull().default(false),
    allowEmergencyAccess: boolean("allow_emergency_access").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [index("patient_profiles_patient_idx").on(t.patientId)]
);

export const consentRecords = pgTable(
  "consent_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    granteeRole: text("grantee_role").notNull(),
    scope: jsonb("scope").notNull(),
    purpose: text("purpose").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true })
  },
  (t) => [index("consent_records_patient_idx").on(t.patientId)]
);

export const accessLogs = pgTable(
  "access_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").notNull(),
    actorRole: text("actor_role").notNull(),
    scope: jsonb("scope").notNull(),
    action: text("action").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => [index("access_logs_patient_idx").on(t.patientId)]
);