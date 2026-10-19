# PR #1 browser QA

Runtime source tested: `2d933ddd55b269be3ab1c9542d0eaab82767f8f3` (PR HEAD unchanged from the reviewed commit). This evidence-only commit does not change application source.

Environment: ChatGPT in-app Chromium browser; desktop 1280x720 and mobile viewport emulation 390x844. Local Wrangler/Miniflare with local D1 at http://127.0.0.1:8788. Separate top-level tab sessions for captain, two crewmates, and a fresh visitor. Only a newly created local room was tested. No production testing or physical devices.

| Check | Result |
| --- | --- |
| Create, join, ready, start | PASS |
| Lobby kick clears removed browser session and returns to entry | PASS |
| Active mission kick clears removed browser session and returns to entry | PASS |
| Remaining players stay connected; stations reassigned | PASS; survivors completed all three stages and won |
| Removed player with another callsign and new browser session cannot join | PASS; generic join error |
| Closed admission survives lobby refresh, active refresh, and rematch | PASS |
| Reopen dialog cancel and Escape preserve closed admission | PASS |
| Deliberate reopen allows fresh player | PASS |
| Noncaptain has no reopen UI and cannot reopen by API | PASS; local API returned 400, captain-only error; admission unchanged |
| Dialog accessible name/description, initial focus, Tab wrapping, focus return | PASS; safe cancel initially focused; Tab cycles cancel/confirm/close |
| Mobile dialog and mission layout | PASS; actual viewport 390x844, no horizontal overflow |
| Voluntary leave, captain transfer, replacement join, ready and next start | PASS |

The mobile crewmate became captain after the original captain voluntarily left. Admission remained closed during transfer, mobile Escape cancelled reopening, and deliberate confirmation enabled the replacement to join. The new crew started another mission.

No concrete browser failures found; no runtime fix or additional regression test was necessary. Existing security regression tests cover the corresponding server-side invariants. Screenshots: [closed lobby](pr1/lobby-closed.jpg), [mobile admission](pr1/mobile-admission.jpg), [mobile mission](pr1/mobile-mission.jpg).

Limitations: one Chromium browser engine; independent tab sessionStorage rather than distinct browser profiles; mobile viewport emulation only. No physical touch-device or cross-browser testing. Browser QA supports merge following normal review and green final CI; this report does not authorize merge or deployment.
