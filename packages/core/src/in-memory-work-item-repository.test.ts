import { InMemoryWorkItemRepository } from './in-memory-work-item-repository';
import { describeWorkItemRepository } from './work-item-repository.contract-test';

describeWorkItemRepository('InMemoryWorkItemRepository', () => new InMemoryWorkItemRepository());
