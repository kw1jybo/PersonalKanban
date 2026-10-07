export type DomainErrorCode = 'NOT_FOUND' | 'FORBIDDEN' | 'VALIDATION';

export abstract class DomainError extends Error {
  abstract readonly code: DomainErrorCode;
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';

  constructor(
    readonly resource: string,
    readonly id: string,
  ) {
    super(`${resource} ${id} not found`);
  }
}

export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';

  constructor(message = 'You do not have access to this resource') {
    super(message);
  }
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION';

  constructor(
    message: string,
    readonly issues: readonly string[] = [],
  ) {
    super(message);
  }
}

/** Closed union of concrete errors, so `switch (error.code)` can be checked for exhaustiveness. */
export type AnyDomainError = NotFoundError | ForbiddenError | ValidationError;

export function isDomainError(value: unknown): value is AnyDomainError {
  return value instanceof DomainError;
}
