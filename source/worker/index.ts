import { POST } from './game';

type Env = { ASSETS: Fetcher; DB: D1Database };

export default {
  async fetch(request: Request, env: Env) {
    if (new URL(request.url).pathname === '/api/game') {
      if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
      return POST(request);
    }
    return env.ASSETS.fetch(request);
  },
  async scheduled(_event: ScheduledEvent, env: Env) {
    const now = Date.now();
    await env.DB.prepare('DELETE FROM rooms WHERE expires < ?').bind(now).run();
    await env.DB.prepare('DELETE FROM rate_limits WHERE reset_at < ?').bind(now).run();
  },
};
