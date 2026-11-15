import type { z } from 'zod';
import { expect } from 'vitest';

export function expectRejectedAt(
  schema: z.ZodType,
  input: unknown,
  ...checkPath: readonly (string | number)[]
): void {
  const result = schema.safeParse(input);
  expect(result.success).toBe(false);
  expect(result.error?.issues[0]?.path).toEqual(checkPath);
}

export function expectAcceptedAs(
  schema: z.ZodType,
  input: unknown,
  expected: unknown = input,
): void {
  const result = schema.safeParse(input);
  expect(result.success).toBe(true);
  expect(result.data).toStrictEqual(expected);
}
