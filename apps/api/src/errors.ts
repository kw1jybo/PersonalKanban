import type { AnyDomainError } from '@personalkanban/core';
import { assertNever } from '@personalkanban/shared';
import type { TRPC_ERROR_CODE_KEY } from '@trpc/server';

export function toTRPCCode(error: AnyDomainError): TRPC_ERROR_CODE_KEY {
  switch (error.code) {
    case 'NOT_FOUND':
      return 'NOT_FOUND';
    case 'FORBIDDEN':
      return 'FORBIDDEN';
    case 'VALIDATION':
      return 'BAD_REQUEST';
    default:
      return assertNever(error);
  }
}
