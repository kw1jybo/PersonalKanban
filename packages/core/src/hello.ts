import type { GreetInput, GreetOutput, UserId } from '@personalkanban/shared';

export type Clock = () => Date;

export function greet(
  userId: UserId | undefined,
  input: GreetInput,
  now: Clock = () => new Date(),
): GreetOutput {
  return {
    message: `Hello, ${input.name}!`,
    greetedAt: now().toISOString(),
    authenticated: userId !== undefined,
  };
}
