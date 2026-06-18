import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // personality, leadership, business_health, customer_persona, strategic_recommendations, life_plan, career_roadmap, action_plan
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  content: text("content"),
  keyInsights: text("key_insights"), // JSON array stored as text
  status: text("status").notNull().default("ready"), // generating, ready
  assessmentId: integer("assessment_id"),
  sessionId: integer("session_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const actionPlansTable = pgTable("action_plans", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  timeframe: text("timeframe").notNull(), // 30_days, 60_days, 90_days
  tasks: integer("tasks").notNull().default(0),
  completedTasks: integer("completed_tasks").notNull().default(0),
  status: text("status").notNull().default("active"), // active, completed
  reportId: integer("report_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({
  id: true,
  createdAt: true,
});

export const insertActionPlanSchema = createInsertSchema(actionPlansTable).omit({
  id: true,
  createdAt: true,
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
export type InsertActionPlan = z.infer<typeof insertActionPlanSchema>;
export type ActionPlan = typeof actionPlansTable.$inferSelect;
