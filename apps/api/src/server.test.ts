import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildServer } from './server';

describe('HTTP server', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer({ logLevel: 'silent' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('reports health', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('serves hello.greet over tRPC', async () => {
    const input = encodeURIComponent(JSON.stringify({ name: 'Ada' }));
    const res = await app.inject({ method: 'GET', url: `/trpc/hello.greet?input=${input}` });
    expect(res.statusCode).toBe(200);
    const body = res.json<{ result: { data: { message: string; authenticated: boolean } } }>();
    expect(body.result.data.message).toBe('Hello, Ada!');
    expect(body.result.data.authenticated).toBe(false);
  });

  it('rejects invalid input with 400', async () => {
    const input = encodeURIComponent(JSON.stringify({ name: '   ' }));
    const res = await app.inject({ method: 'GET', url: `/trpc/hello.greet?input=${input}` });
    expect(res.statusCode).toBe(400);
  });
});
