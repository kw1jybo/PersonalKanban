import type { WorkItemDeps } from './deps';
import type { Board, CreateWorkItemInput, WorkItem, WorkItemState } from '@personalkanban/shared';

export function createWorkItemService(deps: WorkItemDeps) {
  async function getBoard(): Promise<Board> {
    const items = await deps.repository.list({ archived: false });

    function column(state: WorkItemState): WorkItem[] {
      return items.filter((item) => item.state === state).sort((a, b) => a.position - b.position);
    }

    return {
      backlog: column('backlog'),
      todo: column('todo'),
      in_progress: column('in_progress'),
      blocked: column('blocked'),
      done: column('done'),
    };
  }

  async function createWorkItem(input: CreateWorkItemInput): Promise<WorkItem> {
    const active = await deps.repository.list({ archived: false });
    const column = active.filter((item) => item.state === input.state);
    const position = column.reduce((highest, item) => Math.max(highest, item.position), -1) + 1;
    const now = deps.now().toISOString();

    const workItem: WorkItem = {
      id: deps.newId(),
      boardNumber: await deps.repository.nextBoardNumber(),
      title: input.title,
      notes: input.notes,
      state: input.state,
      position,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };

    await deps.repository.save(workItem);
    return workItem;
  }

  return { getBoard, createWorkItem };
}

export type WorkItemService = ReturnType<typeof createWorkItemService>;
