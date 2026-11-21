import { describe, expect, it, beforeEach } from 'vitest';
import { WorkItemIdSchema, type WorkItem, type WorkItemId } from '@personalkanban/shared';
import { makeWorkItem } from './test-fixtures';
import type { WorkItemRepository } from './work-item-repository';

const ARCHIVED_AT = '2026-01-03T00:00:00.000Z';

export function describeWorkItemRepository(
  name: string,
  makeRepository: () => WorkItemRepository,
): void {
  describe(name, () => {
    let repository: WorkItemRepository;

    beforeEach(() => {
      repository = makeRepository();
    });

    // Like get, but fails the test with a clear message instead of returning undefined.
    async function getOrFail(id: WorkItemId): Promise<WorkItem> {
      const item = await repository.get(id);
      if (item === undefined) {
        throw new Error(`Expected item ${id} to exist`);
      }
      return item;
    }

    it('returns a saved item from get', async () => {
      const item = makeWorkItem();
      await repository.save(item);
      expect(await repository.get(item.id)).toStrictEqual(item);
    });

    it('returns undefined from get for an unknown id', async () => {
      expect(await repository.get(WorkItemIdSchema.parse('unknown-id'))).toBeUndefined();
    });

    it('replaces an item saved twice with the same id', async () => {
      const item = makeWorkItem();
      await repository.save(item);
      await repository.save({ ...item, title: 'Changed' });
      expect(await repository.list({ archived: false })).toStrictEqual([
        { ...item, title: 'Changed' },
      ]);
    });

    it('lists only active items when archived is false', async () => {
      const active = makeWorkItem({ id: 'active' });
      const archived = makeWorkItem({ id: 'archived', archivedAt: ARCHIVED_AT });
      await repository.saveMany([active, archived]);
      expect(await repository.list({ archived: false })).toStrictEqual([active]);
    });

    it('lists only archived items when archived is true', async () => {
      const active = makeWorkItem({ id: 'active' });
      const archived = makeWorkItem({ id: 'archived', archivedAt: ARCHIVED_AT });
      await repository.saveMany([active, archived]);
      expect(await repository.list({ archived: true })).toStrictEqual([archived]);
    });

    it('saves every item passed to saveMany', async () => {
      const first = makeWorkItem({ id: 'first' });
      const second = makeWorkItem({ id: 'second' });
      await repository.saveMany([first, second]);
      expect(await repository.get(first.id)).toStrictEqual(first);
      expect(await repository.get(second.id)).toStrictEqual(second);
    });

    it('returns true from delete and removes the item', async () => {
      const item = makeWorkItem();
      await repository.save(item);
      expect(await repository.delete(item.id)).toBe(true);
      expect(await repository.get(item.id)).toBeUndefined();
    });

    it('returns false from delete for an unknown id', async () => {
      expect(await repository.delete(WorkItemIdSchema.parse('unknown-id'))).toBe(false);
    });

    it('does not change a stored item when the saved one is changed', async () => {
      const item = makeWorkItem({ title: 'Original' });
      await repository.save(item);
      item.title = 'Changed';
      expect((await getOrFail(item.id)).title).toBe('Original');
    });

    it('does not change a stored item when an item from get is changed', async () => {
      const item = makeWorkItem({ title: 'Original' });
      await repository.save(item);
      const fetched = await getOrFail(item.id);
      fetched.title = 'Changed';
      expect((await getOrFail(item.id)).title).toBe('Original');
    });

    it('does not change a stored item when an item from list is changed', async () => {
      const item = makeWorkItem({ title: 'Original' });
      await repository.save(item);
      for (const listed of await repository.list({ archived: false })) {
        listed.title = 'Changed';
      }
      expect((await getOrFail(item.id)).title).toBe('Original');
    });

    it('counts 1, 2, 3 from nextBoardNumber', async () => {
      const first = await repository.nextBoardNumber();
      const second = await repository.nextBoardNumber();
      const third = await repository.nextBoardNumber();
      expect([first, second, third]).toStrictEqual([1, 2, 3]);
    });

    it('does not reuse a number after a delete', async () => {
      const first = await repository.nextBoardNumber();
      const item = makeWorkItem({ boardNumber: first });
      await repository.save(item);
      await repository.delete(item.id);
      expect(await repository.nextBoardNumber()).toBe(2);
    });
  });
}
