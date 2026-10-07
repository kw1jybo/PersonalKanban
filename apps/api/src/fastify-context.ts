import type { Context } from './context';

export function createContext(): Context {
  return { userId: undefined };
}
