import { describe, expect, it } from 'vitest';
import { assertNever, GreetInputSchema, UserIdSchema } from './index';

describe('GreetInputSchema', () => {
  it('trims the name and applies the default greeting', () => {
    expect(GreetInputSchema.parse({ name: '  Ada  ' })).toEqual({ name: 'Ada', greeting: 'Hola' });
  });

  it('keeps a greeting the caller supplies, trimmed', () => {
    expect(GreetInputSchema.parse({ name: 'Ada', greeting: '  Howdy ' })).toEqual({
      name: 'Ada',
      greeting: 'Howdy',
    });
  });

  it('rejects blank and overlong names', () => {
    expect(GreetInputSchema.safeParse({ name: '   ' }).success).toBe(false);
    expect(GreetInputSchema.safeParse({ name: 'x'.repeat(51) }).success).toBe(false);
  });

  it('rejects blank and overlong greetings', () => {
    expect(GreetInputSchema.safeParse({ name: 'Ada', greeting: '  ' }).success).toBe(false);
    expect(GreetInputSchema.safeParse({ name: 'Ada', greeting: 'x'.repeat(21) }).success).toBe(
      false,
    );
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
