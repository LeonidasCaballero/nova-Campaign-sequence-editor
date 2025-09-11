import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const flowSequences = pgTable("flow_sequences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  nodes: jsonb("nodes").notNull(),
  edges: jsonb("edges").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Individual action schema
export const actionSchema = z.object({
  action: z.enum(["SEND_CONTACT_REQUEST", "SEND_MESSAGE"]),
  provider: z.enum(["NOVA", "LINKEDIN"]),
  message: z.string().optional(),
});

// Node data schemas
export const actionNodeDataSchema = z.object({
  actions: z.array(actionSchema),
});

export const conditionSchema = z.object({
  condition: z.enum([
    "IS_NOVA",
    "IS_NOVA_CONTACT", 
    "IS_LINKEDIN_CONTACT",
    "HAS_TIME_PASSED",
    "HAS_REJECTED_CONTACT_NOVA",
    "HAS_REJECTED_CONTACT_LINKEDIN"
  ]),
  value: z.boolean(),
  timeInHours: z.number().optional(),
});

export const conditionCheckNodeDataSchema = z.object({
  conditions: z.array(conditionSchema),
});

export const conditionNodeDataSchema = z.object({
  // Basic condition node data - links only to condition checks
});

export const flowNodeSchema = z.object({
  id: z.string(),
  type: z.enum(["action", "condition", "condition_check"]),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.union([
    actionNodeDataSchema,
    conditionNodeDataSchema,
    conditionCheckNodeDataSchema,
  ]),
});

export const flowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFlowSequenceSchema = createInsertSchema(flowSequences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateFlowSequenceSchema = insertFlowSequenceSchema.partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type FlowSequence = typeof flowSequences.$inferSelect;
export type InsertFlowSequence = z.infer<typeof insertFlowSequenceSchema>;
export type UpdateFlowSequence = z.infer<typeof updateFlowSequenceSchema>;
export type FlowNode = z.infer<typeof flowNodeSchema>;
export type FlowEdge = z.infer<typeof flowEdgeSchema>;
export type Action = z.infer<typeof actionSchema>;
export type ActionNodeData = z.infer<typeof actionNodeDataSchema>;
export type ConditionNodeData = z.infer<typeof conditionNodeDataSchema>;
export type ConditionCheckNodeData = z.infer<typeof conditionCheckNodeDataSchema>;
export type Condition = z.infer<typeof conditionSchema>;
