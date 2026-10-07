import { UserIdSchema } from '@personalkanban/shared';
import { describe, expect, it } from 'vitest';
import { greet } from './index';

const fixedClock = () => new Date('2026-01-02T03:04:05.000Z');

describe('greet', () => {
  it('greets anonymous callers', () => {
    expect(greet(undefined, { name: 'Ada' }, fixedClock)).toEqual({
      message: 'Hello, Ada!',
      greetedAt: '2026-01-02T03:04:05.000Z',
      authenticated: false,
    });
  });

  it('flags authenticated callers', () => {
    const userId = UserIdSchema.parse('user_1');
    expect(greet(userId, { name: 'Ada' }, fixedClock).authenticated).toBe(true);
  });
});
