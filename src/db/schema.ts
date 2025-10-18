
import { pgTable, text, varchar, timestamp, integer, uuid, jsonb, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Activity tables - Affiliates, ASF, SAP, Activity Logs

export const affiliates = pgTable('affiliates', {
  // Basic Info
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: text('category', { enum: ['Sports', 'Academic', 'Special Interest', 'Service'] }).notNull(),
  status: text('status', { enum: ['Active', 'Inactive', 'Pending Approval'] }).notNull(),
  
  // Membership Info
  memberCount: integer('member_count').default(0).notNull(),

  // Advisor and Committee
  advisorId: varchar('advisor_id').notNull(),
  committeeMembers: json('committee_members').notNull(), // Storing as JSON array of student IDs

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sap = pgTable('sap', {
  // Basic Info
  id: uuid('id').defaultRandom().primaryKey(),
  affiliateId: uuid('affiliate_id').notNull(),
  activityName: varchar('activity_name', { length: 255 }).notNull(),
  date: timestamp('date').notNull(),
  description: text('description'),
  status: text('status', { enum: ['Pending Validation', 'Awaiting INTIMA Review', 'Requires Amendment', 'Approved', 'Rejected'] }).notNull(),
  submittedBy: varchar('submitted_by').notNull(), // student id

  // Comments and Documents
  comments: json('comments'),
  files: json('files'), // Array of file URLs

  // Finance Review
  financeReviewStatus: text('finance_review_status', { enum: ['Pending', 'Approved', 'Rejected', 'Not Required'] }).default('Pending').notNull(),
  financeComments: json('finance_comments'), // Array of review comments
  financeReviewedBy: varchar('finance_reviewed_by'), // user id who reviewed
  financeReviewedAt: timestamp('finance_reviewed_at'),

  // Activities Review
  activitiesReviewStatus: text('activities_review_status', { enum: ['Pending', 'Approved', 'Rejected', 'Not Required'] }).default('Pending').notNull(),
  activitiesComments: json('activities_comments'), // Array of review comments
  activitiesReviewedBy: varchar('activities_reviewed_by'), // user id who reviewed
  activitiesReviewedAt: timestamp('activities_reviewed_at'),

  // Timestamps
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const asf = pgTable('asf', {
  // Basic Info
  id: uuid('id').defaultRandom().primaryKey(),
  affiliateId: uuid('affiliate_id').notNull(),
  activityName: varchar('activity_name', { length: 255 }).notNull(),
  date: timestamp('date').notNull(),
  description: text('description'),
  status: text('status', { enum: ['Pending Validation', 'Awaiting INTIMA Review', 'Requires Amendment', 'Approved', 'Rejected'] }).notNull(),
  submittedBy: varchar('submitted_by').notNull(), // student id

  // Comments and Documents
  comments: json('comments'),
  files: json('files'), // Array of file URLs

  // Finance Review
  financeReviewStatus: text('finance_review_status', { enum: ['Pending', 'Approved', 'Rejected', 'Not Required'] }).default('Pending').notNull(),
  financeComments: json('finance_comments'), // Array of review comments
  financeReviewedBy: varchar('finance_reviewed_by'), // user id who reviewed
  financeReviewedAt: timestamp('finance_reviewed_at'),

  // Activities Review
  activitiesReviewStatus: text('activities_review_status', { enum: ['Pending', 'Approved', 'Rejected', 'Not Required'] }).default('Pending').notNull(),
  activitiesComments: json('activities_comments'), // Array of review comments
  activitiesReviewedBy: varchar('activities_reviewed_by'), // user id who reviewed
  activitiesReviewedAt: timestamp('activities_reviewed_at'),

  // Timestamps
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const activityLogs = pgTable('activity_logs', {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  relatedFormId: uuid("related_form_id"),
  formType: varchar("form_type", { length: 10 }), // 'sap' | 'asf'
  oldStatus: varchar("old_status", { length: 50 }),
  newStatus: varchar("new_status", { length: 50 }),
});

export const users = pgTable('users', {
  id: varchar('id', { length: 50 }).primaryKey(), // student ID
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  role: text('role', { enum: ['student', 'intima'] }).notNull(),
  affiliates: jsonb('affiliates').notNull().default('[]'), // Storing as JSONB array of affiliate IDs
  permissions: jsonb('permissions').notNull().default('[]'), // Storing as JSONB array of permission strings
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const submissions = pgTable('submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  submittedBy: varchar('submitted_by').notNull(), // student id
  formType: text('form_type', { enum: ['SAP', 'ASF'] }).notNull(),
  formId: uuid('form_id').notNull(),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
});

export const sapRelations = relations(sap, ({ one }) => ({
  affiliate: one(affiliates, {
    fields: [sap.affiliateId],
    references: [affiliates.id],
  }),
}));

export const asfRelations = relations(asf, ({ one }) => ({
  affiliate: one(affiliates, {
    fields: [asf.affiliateId],
    references: [affiliates.id],
  }),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  author: one(users, {
    fields: [submissions.submittedBy],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));
