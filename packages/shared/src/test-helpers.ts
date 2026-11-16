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

/** Removes `field` from a valid input, then expects the schema to reject it at that field. */
export function expectRejectedWithout(
  schema: z.ZodType,
  validInput: Record<string, unknown>,
  field: string,
): void {
  const withoutField = Object.fromEntries(
    Object.entries(validInput).filter(([key]) => key !== field),
  );
  expectRejectedAt(schema, withoutField, field);
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
