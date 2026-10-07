# Signal Lost — Cowork handoff

Start with **COWORK_PROMPT.md**. Give Cowork this entire extracted folder and ask it to follow that file.

This package contains the complete version 2 source, not screenshots or a static demo. It was exported from commit `65e87593c993696519e68e3c8cb8769db3920e57` on October 7, 2026. The original deployment identity has been removed; dependencies, credentials, Git history, generated bundles, and live game data are excluded. No live AI API or paid model key is required for gameplay.

## Files
- `source/`: application code, components, styles, original tooling, pinned package lock, database schema/migration, and tests.
- `COWORK_PROMPT.md`: implementation and deployment instructions.
- `HOSTING.md`: GitHub and hosting options, with official references.
- `ACCEPTANCE_CHECKLIST.md`: verification and known limitations.
- `SHA256SUMS.txt`: checksums for every other file in this handoff.

## Hosting distinction
GitHub can store and version the code. GitHub Pages only hosts static files, while this game needs server endpoints and a shared database. Recommended: GitHub repository + Cloudflare Workers + D1, keeping the browser and API on the same origin. If a github.io address is essential, Cowork must split the frontend and API and handle cross-origin requests deliberately.

## Export status
This is a source handoff for Cowork to adapt, implement and deploy. The current tooling includes ChatGPT Sites/Vinext integrations; it is not a preconfigured, one-click independent Cloudflare deployment. No GitHub repository or new hosting account has been created by this export.

The source build and game tests passed before export. Four independent sessions completed all three mechanics using the production Worker in an isolated local runtime with real local D1. Browser visual QA, real-device playtesting and external-host deployment verification remain to be done by Cowork.
