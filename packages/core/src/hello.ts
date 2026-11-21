import type { GreetInput, GreetOutput, UserId } from '@personalkanban/shared';
import type { Clock } from './deps';

export function greet(
  userId: UserId | undefined,
  input: GreetInput,
  now: Clock = () => new Date(),
): GreetOutput {
  return {
    message: `${input.greeting}, ${input.name}!`,
    greetedAt: now().toISOString(),
    authenticated: userId !== undefined,
  };
}
