import { z } from "zod";

// Planka schemas
export const PlankaUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable().optional(),
  username: z.string(),
  avatarUrl: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});

export const PlankaProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  background: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});

export const PlankaBoardSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  position: z.number(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});

export const PlankaListSchema = z.object({
  id: z.string(),
  boardId: z.string(),
  name: z.string(),
  position: z.number(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});

export const PlankaLabelSchema = z.object({
  id: z.string(),
  boardId: z.string(),
  name: z.string(),
  color: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});

// Define the stopwatch schema
export const PlankaStopwatchSchema = z.object({
  startedAt: z.string().nullable().optional(),
  total: z.number(),
});

export const PlankaCardSchema = z.object({
  id: z.string(),
  listId: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  position: z.number(),
  dueDate: z.string().nullable().optional(),
  isCompleted: z.boolean().optional(),
  stopwatch: PlankaStopwatchSchema.nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});

export const PlankaTaskListSchema = z.object({
  id: z.string(),
  cardId: z.string(),
  name: z.string(),
  position: z.number(),
  showOnFrontOfCard: z.boolean().optional(),
  hideCompletedTasks: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const PlankaTaskSchema = z.object({
  id: z.string(),
  taskListId: z.string().optional(),
  cardId: z.string().optional(),
  name: z.string(),
  isCompleted: z.boolean().optional(),
  position: z.number(),
  assigneeUserId: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().nullable().optional(),
});

export const PlankaCommentSchema = z.object({
  id: z.string(),
  cardId: z.string(),
  userId: z.string(),
  text: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});

export const PlankaAttachmentSchema = z.object({
  id: z.string(),
  cardId: z.string(),
  userId: z.string(),
  name: z.string(),
  url: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});

export const PlankaCardMembershipSchema = z.object({
  id: z.string(),
  cardId: z.string(),
  userId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});

export const PlankaBoardMembershipSchema = z.object({
  id: z.string(),
  boardId: z.string(),
  userId: z.string(),
  role: z.enum(["editor", "admin"]),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});

export const PlankaProjectMembershipSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  userId: z.string(),
  role: z.enum(["editor", "admin"]),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});

export const PlankaCardLabelSchema = z.object({
  id: z.string(),
  cardId: z.string(),
  labelId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable().optional(),
});

// Type exports for Planka
export type PlankaUser = z.infer<typeof PlankaUserSchema>;
export type PlankaProject = z.infer<typeof PlankaProjectSchema>;
export type PlankaBoard = z.infer<typeof PlankaBoardSchema>;
export type PlankaList = z.infer<typeof PlankaListSchema>;
export type PlankaLabel = z.infer<typeof PlankaLabelSchema>;
export type PlankaCard = z.infer<typeof PlankaCardSchema>;
export type PlankaTaskList = z.infer<typeof PlankaTaskListSchema>;
export type PlankaTask = z.infer<typeof PlankaTaskSchema>;
export type PlankaComment = z.infer<typeof PlankaCommentSchema>;
export type PlankaAttachment = z.infer<typeof PlankaAttachmentSchema>;
export type PlankaCardMembership = z.infer<typeof PlankaCardMembershipSchema>;
export type PlankaBoardMembership = z.infer<typeof PlankaBoardMembershipSchema>;
export type PlankaProjectMembership = z.infer<
  typeof PlankaProjectMembershipSchema
>;
export type PlankaCardLabel = z.infer<typeof PlankaCardLabelSchema>;
