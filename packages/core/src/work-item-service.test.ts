import { beforeEach, describe, expect, it } from 'vitest';
import { createWorkItemService, type WorkItemService } from './work-item-service';
import type { WorkItemRepository } from './work-item-repository';
import { InMemoryWorkItemRepository } from './in-memory-work-item-repository';
import {
  FIXED_CLOCK_DATE_STRING,
  FIXED_CLOCK_DATE_STRING_ARCHIVED,
  makeFixedClock,
  makeIdGenerator,
  makeWorkItem,
} from './test-fixtures';
import { BoardSchema, WorkItemSchema, WorkItemStateSchema } from '@personalkanban/shared';

describe('WorkItemService', () => {
  let repository: WorkItemRepository;
  let service: WorkItemService;

  beforeEach(() => {
    repository = new InMemoryWorkItemRepository();
    service = createWorkItemService({
      repository,
      now: makeFixedClock(),
      newId: makeIdGenerator(),
    });
  });

  describe('getBoard', () => {
    it('returns an empty board when there are no work items', async () => {
      const board = await service.getBoard();
      expect(board).toStrictEqual({
        backlog: [],
        todo: [],
        in_progress: [],
        done: [],
        blocked: [],
      });
    });

    it('column items are in the proper state', async () => {
      const wi1 = makeWorkItem({ id: 'item-1', state: 'todo' });
      const wi2 = makeWorkItem({ id: 'item-2', state: 'in_progress' });
      const wi3 = makeWorkItem({ id: 'item-3', state: 'done' });
      const wi4 = makeWorkItem({ id: 'item-4', state: 'blocked' });
      await repository.saveMany([wi1, wi2, wi3, wi4]);
      const board = await service.getBoard();
      expect(board).toStrictEqual({
        backlog: [],
        todo: [wi1],
        in_progress: [wi2],
        blocked: [wi4],
        done: [wi3],
      });
    });

    it('column items are ordered by position', async () => {
      const wi1 = makeWorkItem({ id: 'item-1', state: 'todo', position: 7 });
      const wi2 = makeWorkItem({ id: 'item-2', state: 'todo', position: 1 });
      await repository.save(wi1);
      await repository.save(wi2);
      const board = await service.getBoard();
      expect(board.todo).toStrictEqual([wi2, wi1]);
    });

    it('archived items are not included in the board', async () => {
      const wi1 = makeWorkItem({ id: 'item-1', state: 'todo', archivedAt: null });
      const wi2 = makeWorkItem({
        id: 'item-2',
        state: 'todo',
        archivedAt: FIXED_CLOCK_DATE_STRING_ARCHIVED,
      });
      await repository.save(wi1);
      await repository.save(wi2);
      const board = await service.getBoard();
      expect(board.todo).toStrictEqual([wi1]);
    });

    it('board return object safe parses', async () => {
      const wi1 = makeWorkItem({ id: 'item-1', state: 'todo' });
      const wi2 = makeWorkItem({ id: 'item-2', state: 'in_progress' });
      const wi3 = makeWorkItem({ id: 'item-3', state: 'done' });
      const wi4 = makeWorkItem({ id: 'item-4', state: 'blocked' });
      await repository.saveMany([wi1, wi2, wi3, wi4]);
      const board = await service.getBoard();
      expect(BoardSchema.safeParse(board).success).toBe(true);
    });
  });

  describe('createWorkItem', () => {
    it.each(WorkItemStateSchema.options)(
      'work items created are incremented in position for state %s',
      async (state) => {
        const wi1 = await service.createWorkItem({ title: 'Item 1', notes: '', state: state });
        const wi2 = await service.createWorkItem({ title: 'Item 2', notes: '', state: state });
        const wi3 = await service.createWorkItem({ title: 'Item 3', notes: '', state: state });
        expect(wi1.position).toBe(0);
        expect(wi2.position).toBe(1);
        expect(wi3.position).toBe(2);
      },
    );

    it('work items created in columns start at position 0', async () => {
      const wi1 = await service.createWorkItem({ title: 'Item 1', notes: '', state: 'todo' });
      const wi2 = await service.createWorkItem({
        title: 'Item 2',
        notes: '',
        state: 'in_progress',
      });
      const wi3 = await service.createWorkItem({ title: 'Item 3', notes: '', state: 'done' });
      const wi4 = await service.createWorkItem({ title: 'Item 4', notes: '', state: 'blocked' });
      const wi5 = await service.createWorkItem({ title: 'Item 5', notes: '', state: 'backlog' });
      expect(wi1.position).toBe(0);
      expect(wi2.position).toBe(0);
      expect(wi3.position).toBe(0);
      expect(wi4.position).toBe(0);
      expect(wi5.position).toBe(0);
    });

    it.each(WorkItemStateSchema.options)(
      'work items created are incremented in position for state %s, even if one is archived',
      async (state) => {
        const wi1 = await service.createWorkItem({ title: 'Item 1', notes: '', state: state });
        const wi2 = await service.createWorkItem({ title: 'Item 2', notes: '', state: state });
        const wi3 = await service.createWorkItem({ title: 'Item 3', notes: '', state: state });
        // TODO(2e): archive through the service once it exists, instead of saving directly.
        await repository.save({ ...wi2, archivedAt: FIXED_CLOCK_DATE_STRING_ARCHIVED });
        const wi4 = await service.createWorkItem({ title: 'Item 4', notes: '', state: state });
        expect(wi1.position).toBe(0);
        expect(wi2.position).toBe(1);
        expect(wi3.position).toBe(2);
        expect(wi4.position).toBe(3);
      },
    );

    it('copies the input, starts unarchived and uses the clock for both timestamps', async () => {
      const wi1 = await service.createWorkItem({
        title: 'Item 1',
        notes: 'testNotes',
        state: 'todo',
      });
      expect(wi1.archivedAt).toBeNull();
      expect(wi1.title).toEqual('Item 1');
      expect(wi1.notes).toEqual('testNotes');
      expect(wi1.state).toEqual('todo');
      expect(wi1.createdAt).toBe(FIXED_CLOCK_DATE_STRING);
      expect(wi1.updatedAt).toBe(FIXED_CLOCK_DATE_STRING);
    });

    it('two items with the same title get different ids and numbers', async () => {
      const wi1 = await service.createWorkItem({
        title: 'Item 1',
        notes: 'testNotes',
        state: 'todo',
      });
      const wi2 = await service.createWorkItem({
        title: 'Item 1',
        notes: 'testNotes',
        state: 'todo',
      });
      expect(wi1.id).toEqual('id-1');
      expect(wi2.id).toEqual('id-2');
      expect(wi1.id).not.toEqual(wi2.id);
      expect(wi1.boardNumber).not.toEqual(wi2.boardNumber);
    });

    it('numbers items 1, 2, 3 across the whole board, not per column', async () => {
      const wi1 = await service.createWorkItem({ title: 'Item 1', notes: '', state: 'todo' });
      const wi2 = await service.createWorkItem({ title: 'Item 2', notes: '', state: 'done' });
      const wi3 = await service.createWorkItem({ title: 'Item 3', notes: '', state: 'todo' });
      expect(wi1.boardNumber).toBe(1);
      expect(wi2.boardNumber).toBe(2);
      expect(wi3.boardNumber).toBe(3);
    });

    it('does not reuse the number of an archived item', async () => {
      const wi1 = await service.createWorkItem({ title: 'Item 1', notes: '', state: 'todo' });
      const wi2 = await service.createWorkItem({ title: 'Item 2', notes: '', state: 'todo' });
      // TODO(2e): archive through the service once it exists, instead of saving directly.
      await repository.save({ ...wi1, archivedAt: FIXED_CLOCK_DATE_STRING_ARCHIVED });
      const wi3 = await service.createWorkItem({ title: 'Item 3', notes: '', state: 'todo' });
      expect(wi2.boardNumber).toBe(2);
      expect(wi3.boardNumber).toBe(3);
    });

    it('returns an item that passes WorkItemSchema', async () => {
      const wi1 = await service.createWorkItem({
        title: 'Item 1',
        notes: 'testNotes',
        state: 'todo',
      });
      expect(WorkItemSchema.safeParse(wi1).success).toBe(true);
    });

    it('saves the item so getBoard returns it', async () => {
      const wi1 = await service.createWorkItem({
        title: 'Item 1',
        notes: 'testNotes',
        state: 'todo',
      });
      const board = await service.getBoard();
      expect(board.todo).toContainEqual(wi1);
    });
  });
});
