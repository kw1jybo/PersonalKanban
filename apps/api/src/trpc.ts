import { isDomainError } from '@personalkanban/core';
import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context';
import { toTRPCCode } from './errors';

const t = initTRPC.context<Context>().create();

const mapDomainErrors = t.middleware(async ({ next }) => {
  const result = await next();
  if (!result.ok) {
    const cause = result.error.cause;
    if (isDomainError(cause)) {
      throw new TRPCError({
        code: toTRPCCode(cause),
        message: cause.message,
        cause,
      });
    }
  }
  return result;
});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure.use(mapDomainErrors);
