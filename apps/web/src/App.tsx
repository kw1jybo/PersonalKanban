import { GreetInputSchema } from '@personalkanban/shared';
import { useQuery } from '@tanstack/react-query';
import { useState, type SubmitEvent } from 'react';
import { useTRPC } from './trpc';

export function App() {
  const trpc = useTRPC();
  const [draft, setDraft] = useState('');
  const [name, setName] = useState('world');

  // Input and output types are inferred from the server's router, with no hand-written types.
  const greeting = useQuery(trpc.hello.greet.queryOptions({ name }));

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = GreetInputSchema.safeParse({ name: draft });
    if (parsed.success) setName(parsed.data.name);
  };

  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 480, margin: '4rem auto' }}>
      <h1>PersonalKanban</h1>
      <form onSubmit={handleSubmit}>
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
          }}
          placeholder="Your name"
          aria-label="Your name"
        />
        <button type="submit">Greet</button>
      </form>
      {greeting.isPending && <p>Loading…</p>}
      {greeting.isError && <p role="alert">Error: {greeting.error.message}</p>}
      {greeting.isSuccess && (
        <p>
          {greeting.data.message}{' '}
          <small>({new Date(greeting.data.greetedAt).toLocaleTimeString()})</small>
        </p>
      )}
    </main>
  );
}
