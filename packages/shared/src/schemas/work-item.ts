import { z } from 'zod';

export const TITLE_MAX_LENGTH = 120;
export const NOTES_MAX_LENGTH = 5000;

export const WorkItemStateSchema = z.enum(['backlog', 'todo', 'in_progress', 'blocked', 'done']);
export type WorkItemState = z.infer<typeof WorkItemStateSchema>;

export const WorkItemIdSchema = z.string().min(1).brand<'WorkItemId'>();
export type WorkItemId = z.infer<typeof WorkItemIdSchema>;

export const WorkItemTitleSchema = z.string().trim().min(1).max(TITLE_MAX_LENGTH);
export type WorkItemTitle = z.infer<typeof WorkItemTitleSchema>;

export const WorkItemNotesSchema = z.string().max(NOTES_MAX_LENGTH);
export type WorkItemNotes = z.infer<typeof WorkItemNotesSchema>;

export const WorkItemIdInputSchema = z.object({ id: WorkItemIdSchema });
export type WorkItemIdInput = z.infer<typeof WorkItemIdInputSchema>;

export const WorkItemNumberSchema = z.int().min(1).brand<'WorkItemNumber'>();
export type WorkItemNumber = z.infer<typeof WorkItemNumberSchema>;

export const WorkItemSchema = z.object({
  id: WorkItemIdSchema,
  boardNumber: WorkItemNumberSchema,
  title: WorkItemTitleSchema,
  notes: WorkItemNotesSchema,
  state: WorkItemStateSchema,
  position: z.int().min(0),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  archivedAt: z.iso.datetime().nullable(),
});
export type WorkItem = z.infer<typeof WorkItemSchema>;

export const CreateWorkItemInputSchema = z.object({
  title: WorkItemTitleSchema,
  notes: WorkItemNotesSchema.default(''),
  state: WorkItemStateSchema.default('backlog'),
});
export type CreateWorkItemInput = z.infer<typeof CreateWorkItemInputSchema>;

export const UpdateWorkItemInputSchema = z.object({
  id: WorkItemIdSchema,
  title: WorkItemTitleSchema.optional(),
  notes: WorkItemNotesSchema.optional(),
});
export type UpdateWorkItemInput = z.infer<typeof UpdateWorkItemInputSchema>;

export const MoveWorkItemInputSchema = z.object({
  id: WorkItemIdSchema,
  state: WorkItemStateSchema,
  position: z.int().min(0),
});
export type MoveWorkItemInput = z.infer<typeof MoveWorkItemInputSchema>;

export const BoardSchema = z.record(WorkItemStateSchema, z.array(WorkItemSchema));
export type Board = z.infer<typeof BoardSchema>;
