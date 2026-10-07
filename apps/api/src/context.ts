import type { UserId } from '@personalkanban/shared';

export interface Context {
  /** Populated by the auth layer in milestone 4; always undefined until then. */
  userId: UserId | undefined;
}
