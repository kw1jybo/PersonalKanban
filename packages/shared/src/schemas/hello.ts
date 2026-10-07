import { z } from 'zod';

export const GreetInputSchema = z.object({
  name: z.string().trim().min(1).max(50),
});
export type GreetInput = z.infer<typeof GreetInputSchema>;

export const GreetOutputSchema = z.object({
  message: z.string(),
  greetedAt: z.iso.datetime(),
  authenticated: z.boolean(),
});
export type GreetOutput = z.infer<typeof GreetOutputSchema>;
