# Hosting plan

## Recommended: GitHub source + Cloudflare Workers and D1

This keeps the browser and `/api/game` on one public origin and matches the existing Worker/D1 architecture. GitHub is the source repository; Cloudflare serves the running game. The project needs migration of its current Sites-specific build/deploy configuration before standalone deployment.

Cowork should:
1. Inspect and adapt the included build configuration. Keep a project-owned Wrangler configuration, Worker entrypoint and static assets output; use actual generated paths after verifying the build.
2. Create a new D1 database, bind it as `DB`, and apply `source/drizzle/0000_blushing_mercury.sql` using the project's migration workflow. The original deployment database is not exported.
3. Verify the Worker exports a fetch handler, serves frontend assets and `/api/game`, and accesses the intended database.
4. Connect the GitHub repository to Workers Builds, or implement a GitHub Actions deployment with provider-managed secrets. Set correct build root, build command and deployment command for the migrated project.
5. Test public access and independent multiplayer sessions after deployment. Do not rely on a successful build alone.

## If GitHub Pages is mandatory

GitHub Pages is static hosting. A split design is required: Pages for frontend assets, plus an external API and database. The current app is not a static Pages export. Cowork must adapt frontend routing and asset paths for the repository subpath, configure the backend URL, implement precise CORS/OPTIONS behavior, and update the existing same-origin checks securely. Client-side storage must not replace shared multiplayer state.

## Current verification commands (run within source/)

Use the Node and pnpm versions declared in package.json, or a tested compatible version. Install from pnpm-lock.yaml with a frozen lockfile. The clean exported checkout defaults to the portable profile; the original managed runtime profile was excluded.

```sh
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
node --experimental-strip-types tests/game.test.mjs
pnpm build
node tests/worker.test.mjs
```

The Worker test expects generated output at `dist/server` and the D1 migration above. Adapt these paths if the hosting migration changes them. These commands passed for the source in its original environment; a clean external installation and deployment still need verification. Do not claim the sanitized package has already been independently hosted.

## Official references checked October 7, 2026
- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- Cloudflare Git integration: https://developers.cloudflare.com/workers/ci-cd/builds/
- Worker bindings: https://developers.cloudflare.com/workers/runtime-apis/bindings/
- D1 setup: https://developers.cloudflare.com/d1/get-started/

No credentials, remote database identifiers, or preconfigured GitHub destination are included.
