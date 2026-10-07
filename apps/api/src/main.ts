import { loadEnv } from './env';
import { buildServer } from './server';

const env = loadEnv();
const app = await buildServer({ logLevel: env.LOG_LEVEL });
await app.listen({ host: env.HOST, port: env.PORT });
