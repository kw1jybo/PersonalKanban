import type { WorkItemId } from '@personalkanban/shared';
import type { WorkItemRepository } from './work-item-repository';

export type Clock = () => Date;
export type IdGenerator = () => WorkItemId;

export interface WorkItemDeps {
  repository: WorkItemRepository;
  now: Clock;
  newId: IdGenerator;
}
