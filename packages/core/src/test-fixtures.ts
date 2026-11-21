import { WorkItemIdSchema, WorkItemNumberSchema, type WorkItem } from '@personalkanban/shared';
import type { Clock, IdGenerator } from './deps';

export const FIXED_CLOCK_DATE = () => new Date('2026-01-02T03:04:05.000Z');
export const FIXED_CLOCK_DATE_STRING = FIXED_CLOCK_DATE().toISOString();

export const FIXED_CLOCK_DATE_ARCHIVED = () => new Date('2026-02-02T03:04:05.000Z');
export const FIXED_CLOCK_DATE_STRING_ARCHIVED = FIXED_CLOCK_DATE_ARCHIVED().toISOString();

type WorkItemOverrides = Omit<Partial<WorkItem>, 'id'> & { id?: string };

export function makeWorkItem({ id = 'item-1', ...overrides }: WorkItemOverrides = {}): WorkItem {
  return {
    id: WorkItemIdSchema.parse(id),
    boardNumber: WorkItemNumberSchema.parse(1),
    title: 'A title',
    notes: '',
    state: 'backlog',
    position: 0,
    createdAt: FIXED_CLOCK_DATE_STRING,
    updatedAt: FIXED_CLOCK_DATE_STRING,
    archivedAt: null,
    ...overrides,
  };
}

export function makeIdGenerator(): IdGenerator {
  let ct = 0;
  return () => {
    ct += 1;
    return WorkItemIdSchema.parse(`id-${String(ct)}`);
  };
}

export function makeFixedClock(): Clock {
  return FIXED_CLOCK_DATE;
}
