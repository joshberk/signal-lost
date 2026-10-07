import { POST } from './game';

export default {
  async fetch(request: Request, env: { ASSETS: Fetcher }) {
    if (new URL(request.url).pathname === '/api/game') {
      if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
      return POST(request);
    }
    return env.ASSETS.fetch(request);
  },
};
