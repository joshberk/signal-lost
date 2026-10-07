# Instructions for Cowork

You are taking over Signal Lost, a cooperative browser game built with ChatGPT Work for the Handshake AI Skills Studio x OpenAI Multiplayer Game Challenge. I want you to implement and refine the supplied project, put its source in my GitHub repository, and publish a working public game.

## Work from the existing implementation
1. Read README.md, HOSTING.md, ACCEPTANCE_CHECKLIST.md and source/GAME_NOTES.md.
2. Inspect the code before changing it. Preserve the working game and its dark green/amber mission-control design. Do not replace it with a landing page or a local-only demo.
3. Use source/ as the application repository root. Preserve third-party license notices and the lockfile; adapt dependencies only when necessary and explain changes.
4. If I have supplied an existing repository or folder, work there without overwriting unrelated work. If no destination exists, ask me once for the GitHub repository URL or my desired owner/name. Keep repository visibility private unless I request public source; the playable website must be public.
5. Continue all work possible locally before asking me for missing account access. Never put credentials into source files, documentation, chat, or commits.

## Product requirements
- Public browser play on phones and laptops; no player login or installation.
- Room codes and invite links for 2–4 players, plus explicitly labeled solo practice.
- Four stations: Comms, Navigation, Systems, Security. Distribute stations across 2–4 people; one person manages all stations in practice.
- Nine-minute rescue mission with three stages: evidence elimination, telemetry calculation, and signal decoding.
- Private clues and calibration/codebook information; answers and validation remain server-side.
- All four station settings must commit before resolving a stage. Incorrect configurations deduct 20 seconds.
- Independently varied settings, free stage-specific hints, decision replay, and rematches.
- Refresh reconnect using the existing session, captain takeover after disconnection, seat release outside active play, and clear error states.
- Shared persistent authoritative state, atomic updates, valid role permissions, and no lost updates under simultaneous actions.
- Keyboard accessibility, readable mobile layouts, reduced motion and optional sound.
- Do not add a live LLM dependency; no AI service is required during play.

## GitHub and hosting
Recommended implementation: GitHub stores source; Cloudflare Workers serves the full application and D1 stores game rooms. Follow HOSTING.md. Do not claim that pushing this project to GitHub Pages will make multiplayer work.

The source currently uses React/TypeScript, Vinext/Vite, a Cloudflare Worker API route and D1. Convert platform-specific deployment wiring to standard, project-owned configuration. Audit vite.config.ts, build/sites-worker.ts, build/sites-vite-plugin.ts, scripts/, and .openai/hosting.json. There is no original project_id in the export. Do not create or edit a ChatGPT Site to complete this migration, and do not rely on /root/.codex, /workspace, sites-preview or runtime-owned package caches.

Choose the smallest reliable migration. Keep the existing framework if it can be deployed independently; if a framework limitation requires a different build setup, retain the gameplay engine, interfaces, visual design and behavior and explain the change. No platform migration has been completed for you.

Provision a new D1 database in my account and bind it as DB. Preserve prepared statements and compare-and-swap revision updates. Apply the supplied schema migration through the chosen deployment process. Do not copy live rooms or any original account identifiers.

Set up reproducible build/test commands and GitHub-based deployment using either Cloudflare's Git integration or a GitHub Actions workflow. Keep deployment credentials in the provider's secret store. Ask before incurring paid charges. Use current official documentation, and verify installation/build behavior from a fresh checkout rather than assuming package versions are available.

If I explicitly require GitHub Pages/github.io hosting, implement a static frontend there plus a separately hosted backend/database. Make the API origin configurable; support OPTIONS and an exact origin allowlist. Adapt the current same-origin request guard without simply disabling it. Test invite URLs and asset routing beneath the repository subpath. Explain that the backend remains externally hosted.

## Validation before handoff
Run the supplied engine tests and production Worker/database integration tests, adapting the latter if the runtime changes. Add only tests needed for material migration risks. Verify concurrent joins/locks, unauthorized station changes, refresh reconnect, timer expiration, wrong answers, rematches and lobby seat release.

Perform browser QA and actual two-device playtesting, plus a four-session integration test. Verify private clues are not disclosed to the wrong client and answer tables are not bundled into browser JavaScript. Test empty/invalid/full/expired rooms, connection loss, keyboard navigation and a narrow phone viewport. Mark any unperformed checks honestly.

Check deployment under a signed-out browser: no account gate, no missing assets, working rooms and database, and successful gameplay between independent sessions. Capture useful screenshots for review. Return the GitHub repository URL, public game URL, commit SHA, concise change log, test results, deployment instructions and outstanding issues.

## Contest context
The judging criteria are Execution, Creativity, Usefulness/Value, and Polish/Thoughtfulness, each 25%. Preserve the project’s ChatGPT Work provenance. Target submission October 28, 2026; the supplied official PDF states October 30 at 11:59 PM Pacific, although the public mission page advertises October 31. Verify the full signed-in mission requirements with me before preparing the final entry. The final submission requires a title, cover image, description and public URL. Do not submit the contest entry on my behalf without my instruction.

Begin by inspecting the source, identifying the smallest hosting migration, and implementing it. Do not stop after writing a plan.
