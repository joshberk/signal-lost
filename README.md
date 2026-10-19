# Signal Lost

Cooperative rescue mystery for 2–4 real players, with solo practice. Built with ChatGPT Work for Joshua Berkoh for the Handshake AI Skills Studio x OpenAI Multiplayer Game Challenge. Export provenance: `65e87593c993696519e68e3c8cb8769db3920e57`, October 7, 2026. Contest submission has not been performed.

The application root is **source/**. React/Vite serves the existing dark green and amber interface; a Cloudflare Worker handles `/api/game`; D1 persists authoritative rooms. Answers, private evidence generation, validation, prepared queries and revision compare-and-swap updates stay on the server. No player accounts, live AI service, or API keys are needed for gameplay.

## Local development

Use Node 22.13+ (Node 22.16 tested) and pnpm 11.25.0.

```sh
cd source
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm test
pnpm db:migrate:local
pnpm start
```

Open http://127.0.0.1:8787. For frontend hot reload, leave `pnpm start` running and run `pnpm dev` in a second terminal. Open the Vite URL (normally port 5173); its `/api` proxy reaches the local Worker on 8787. Local migrations and Worker use the same default `.wrangler/state` directory. `pnpm build` bundles frontend assets and dry-runs Worker bundling without publishing.

## First deployment

1. Authenticate with `pnpm exec wrangler login` in `source/`.
2. Create a **new** database: `pnpm exec wrangler d1 create signal-lost`. Replace the placeholder `database_id` in `source/wrangler.jsonc` with the returned ID, preserving the binding name `DB` and `migrations_dir`. Database IDs are configuration, not credentials.
3. Verify the selected Cloudflare account and free-plan eligibility before deployment; obtain approval before any paid charges.
4. Run `pnpm deploy`. It builds, applies remote migrations, then deploys the Worker and assets to the same public origin. Use the actual `workers.dev` URL returned by Wrangler.
5. Verify signed-out access and complete a mission with independent browser sessions. Do not treat a successful deploy command as game verification.

The checked-in placeholder supports local D1 only. Remote deployment is incomplete until a real database ID is configured. The original ChatGPT-hosted game and its database are not touched.

## GitHub deployment

Target: https://github.com/joshberk/signal-lost. Keep its existing visibility. `.github/workflows/deploy.yml` installs from the frozen lockfile, type-checks, builds and tests every PR, then migrates/deploys pushes to `main` and manual runs on `main`.

In the repository's Actions secrets, set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Scope the token to the intended account with Workers Scripts edit and D1 edit permissions, plus account access required by Wrangler. Enter secrets directly in GitHub, never in code, commits or chat. PR verification does not receive deployment secrets.

Set the new database's ID as the Actions **variable** `CLOUDFLARE_D1_DATABASE_ID`, or commit its real ID in `source/wrangler.jsonc`. A deployment preflight reports every missing setting before migration starts. It generates an ignored `source/wrangler.deploy.json` with the chosen DB ID; credentials remain in the environment. For manual deployment, `pnpm deploy` uses the same preflight/configuration and supports Wrangler login. CI requires the token/account secrets even if you are logged in locally. Deployments on the same branch run serially to avoid overlapping migrations.

## Future migrations and releases

Add numbered SQL migrations under `source/drizzle/` (retain applied migrations). Test with `pnpm db:migrate:local`, run typecheck/build/test, then commit and push to main. Actions applies pending migrations before publishing. `pnpm db:migrate:remote` applies only migrations; `pnpm deploy` performs the full manual release. Back up production data and assess compatibility before destructive schema changes.

The included migrations create `rooms(code, state, revision, expires)` and `rate_limits(bucket, count, reset_at)`. No original live rooms are included. The previous unused Drizzle generator was removed; migrations use standard Wrangler SQL files.

## Migration and verification

The existing game page, CSS, UI components, engine and SQL migration are preserved. Sites/Vinext/Next tooling, connector preview/auth, original hosting identity and unused starter components were removed. The framework change is build wiring: this page needs no server rendering, and the existing API fits a direct Worker. Runtime versions are pinned; the Workers compatibility date remains `2026-05-15`, supported by the pinned Wrangler/workerd runtime. Third-party CSS/license notices remain in `source/vendor/`.

See [QA results](docs/QA.md), [game notes](source/GAME_NOTES.md), and [screenshots](docs/screenshots/). Original handoff documents in `docs/` are historical reference, not current deployment instructions.

Official references checked for the migration: [Worker static asset routing](https://developers.cloudflare.com/workers/static-assets/routing/advanced/), [D1 setup](https://developers.cloudflare.com/d1/get-started/), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/), and [GitHub Actions deployment](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/).

## Prototype limits

Polling every 1.5 seconds; same-tab sessionStorage reconnect; no built-in voice chat or cross-device identity recovery. Active missions disallow leaving, but the captain can remove a crewmate at any time. Removal pauses all new joins, including after rematches; existing crew keep their sessions. From the lobby, the captain can explicitly confirm **Reopen joining**, which permits anyone with the code (including a previously removed person) to join again. Without player accounts, this is an admission boundary, not a permanent identity ban. Captain takeover is available after 60 seconds disconnected. Rooms are inaccessible after 24 hours and expired rows are deleted by scheduled cleanup every six hours.

Rate-limit admission is an atomic D1 upsert. Room creation permits 10 attempts per 10 minutes, joins 30 per 10 minutes, and invalid session requests 60 per minute. These anonymous allowances use 1,024 fixed IP-hash slots per scope, bounding counter storage to 3,072 public buckets; collisions can share an anonymous allowance. Invalid codes/tokens never become bucket keys. Authenticated lock/unlock uses 120 attempts per minute **per room/player**, after session validation, and bypasses the anonymous abuse quota so an abusive Wi-Fi peer cannot consume another player's gameplay quota. Invalid session paths share one generic error, including reads and heartbeats. Limits do not replace Cloudflare edge protection or stop distributed floods/read amplification. Physical-device and real-player difficulty testing remain required.
