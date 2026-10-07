import type { AppRouter } from '@personalkanban/api';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

export function createApiClient() {
  return createTRPCClient<AppRouter>({
    links: [httpBatchLink({ url: '/trpc' })],
  });
}
