import { ForbiddenError, NotFoundError, ValidationError } from '@personalkanban/core';
import { TRPCError } from '@trpc/server';
import { describe, expect, it } from 'vitest';
import { toTRPCCode } from './errors';
import { createCallerFactory, publicProcedure, router } from './trpc';

describe('toTRPCCode', () => {
  it('maps every domain error to a tRPC code', () => {
    expect(toTRPCCode(new NotFoundError('Board', '1'))).toBe('NOT_FOUND');
    expect(toTRPCCode(new ForbiddenError())).toBe('FORBIDDEN');
    expect(toTRPCCode(new ValidationError('bad'))).toBe('BAD_REQUEST');
  });
});

describe('domain error middleware', () => {
  const testRouter = router({
    missing: publicProcedure.query(() => {
      throw new NotFoundError('Board', '42');
    }),
    boom: publicProcedure.query(() => {
      throw new Error('unexpected');
    }),
  });
  const caller = createCallerFactory(testRouter)({ userId: undefined });

  it('turns a DomainError into the matching TRPCError', async () => {
    const error = await caller.missing().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(TRPCError);
    expect((error as TRPCError).code).toBe('NOT_FOUND');
    expect((error as TRPCError).message).toBe('Board 42 not found');
  });

  it('leaves unknown errors as internal server errors', async () => {
    const error = await caller.boom().catch((e: unknown) => e);
    expect((error as TRPCError).code).toBe('INTERNAL_SERVER_ERROR');
  });
});
