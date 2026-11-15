import { describe, expect, expectTypeOf, it } from 'vitest';
import { UserIdSchema, type WorkItemId, type UserId } from '../index';

describe('UserIdSchema', () => {
  it('rejects empty ids', () => {
    expect(UserIdSchema.safeParse('').success).toBe(false);
  });

  it('WorkItemId is a distinct type, not a plain string or another id', () => {
    expectTypeOf<string>().not.toExtend<WorkItemId>(); // a plain string is not a WorkItemId
    expectTypeOf<UserId>().not.toExtend<WorkItemId>(); // a UserId is not a WorkItemId
    expectTypeOf<WorkItemId>().toExtend<string>(); // but a WorkItemId is still a string
  });
});
