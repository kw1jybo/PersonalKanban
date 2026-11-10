import { GreetInputSchema } from '@personalkanban/shared';
import { useQuery } from '@tanstack/react-query';
import { useState, type SubmitEvent } from 'react';
import { useTRPC } from './trpc';

export function App() {
  const trpc = useTRPC();
  const [draft, setDraft] = useState('');
  const [name, setName] = useState('world');
  const [greetingDraft, setGreetingDraft] = useState('');
  const [greetingText, setGreetingText] = useState<string | undefined>(undefined);

  const greeting = useQuery(trpc.hello.greet.queryOptions({ name, greeting: greetingText }));

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = GreetInputSchema.safeParse({
      name: draft,
      greeting: greetingDraft || undefined,
    });
    if (parsed.success) {
      setName(parsed.data.name);
      setGreetingText(parsed.data.greeting);
    }
  };

  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 480, margin: '4rem auto' }}>
      <h1>PersonalKanban</h1>
      <form onSubmit={handleSubmit}>
        <input
          value={greetingDraft}
          onChange={(e) => {
            setGreetingDraft(e.target.value);
          }}
          placeholder="Greeting"
          aria-label="Greeting"
        />
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
