import { describe, expect, it } from 'vitest';
import { assertNever, GreetInputSchema, UserIdSchema } from './index';

describe('GreetInputSchema', () => {
  it('trims the name', () => {
    expect(GreetInputSchema.parse({ name: '  Ada  ' })).toEqual({ name: 'Ada' });
  });

  it('rejects blank and overlong names', () => {
    expect(GreetInputSchema.safeParse({ name: '   ' }).success).toBe(false);
    expect(GreetInputSchema.safeParse({ name: 'x'.repeat(51) }).success).toBe(false);
  });
});

describe('UserIdSchema', () => {
  it('rejects empty ids', () => {
    expect(UserIdSchema.safeParse('').success).toBe(false);
  });
});

describe('assertNever', () => {
  it('throws if an impossible value reaches it at runtime', () => {
    expect(() => {
      assertNever('surprise' as never);
    }).toThrow(/Unhandled/);
  });
});
