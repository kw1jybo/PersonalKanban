import {
  WorkItemNumberSchema,
  type WorkItem,
  type WorkItemId,
  type WorkItemNumber,
} from '@personalkanban/shared';
import type { WorkItemRepository } from './work-item-repository';

export class InMemoryWorkItemRepository implements WorkItemRepository {
  private readonly items = new Map<WorkItemId, WorkItem>();
  private lastBoardNumber = 0;

  list(options: { archived: boolean }): Promise<WorkItem[]> {
    const matching = [...this.items.values()].filter(
      (item) => (item.archivedAt !== null) === options.archived,
    );
    return Promise.resolve(matching.map((item) => ({ ...item })));
  }

  get(id: WorkItemId): Promise<WorkItem | undefined> {
    const item = this.items.get(id);
    return Promise.resolve(item === undefined ? undefined : { ...item });
  }

  save(workItem: WorkItem): Promise<void> {
    this.items.set(workItem.id, { ...workItem });
    return Promise.resolve();
  }

  saveMany(workItems: WorkItem[]): Promise<void> {
    for (const workItem of workItems) {
      this.items.set(workItem.id, { ...workItem });
    }
    return Promise.resolve();
  }

  delete(id: WorkItemId): Promise<boolean> {
    return Promise.resolve(this.items.delete(id));
  }

  nextBoardNumber(): Promise<WorkItemNumber> {
    this.lastBoardNumber += 1;
    return Promise.resolve(WorkItemNumberSchema.parse(this.lastBoardNumber));
  }
}
