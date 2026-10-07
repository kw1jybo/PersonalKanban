import { greet } from '@personalkanban/core';
import { GreetInputSchema, GreetOutputSchema } from '@personalkanban/shared';
import { publicProcedure, router } from './trpc';

export const appRouter = router({
  hello: router({
    greet: publicProcedure
      .input(GreetInputSchema)
      .output(GreetOutputSchema)
      .query(({ ctx, input }) => greet(ctx.userId, input)),
  }),
});

export type AppRouter = typeof appRouter;
