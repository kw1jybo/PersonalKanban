import type { WorkItem, WorkItemId, WorkItemNumber } from '@personalkanban/shared';

export interface WorkItemRepository {
  list(options: { archived: boolean }): Promise<WorkItem[]>;
  get(id: WorkItemId): Promise<WorkItem | undefined>;
  save(workItem: WorkItem): Promise<void>;
  saveMany(workItems: WorkItem[]): Promise<void>;
  delete(id: WorkItemId): Promise<boolean>;
  nextBoardNumber(): Promise<WorkItemNumber>;
}
