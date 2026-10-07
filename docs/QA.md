# Migration QA — October 7, 2026

## Completed

- TypeScript check passed.
- Frontend production build and Worker dry-run bundle passed.
- Included engine suite: 12 complete missions covering 1–4 players and all option positions; private clue solvability, legacy rooms, role authorization, redaction, penalty, stale actions, reconnect identity, takeover, timeout, rematch and seat release passed.
- Actual built Worker with real isolated local D1: four independent token sessions completed all three stages with simultaneous commitments, persisted result, rematch, leaving and replacement player.
- Local Wrangler SQL migration applied successfully.
- Two independently created browser tabs joined via invite URL, read distinct assigned clues, completed all three stages using browser radio buttons/tabs/commit controls, and both reached the success screen. No simulated player logic was added to the application.
- Browser refresh reconnected the captain to the same completed room. Browser rematch returned to lobby; both players could leave.
- Desktop landing, lobby, mission, result/replay and help dialog rendered with the preserved visual design. Screenshots are in `docs/screenshots/`.
- Expanded built-Worker API checks passed: two-player station allocation, 20-second penalty, stale/unauthorized actions, active-play leave prevention, captain takeover after elapsed time, persisted timeout, solo practice, invalid/full/expired rooms, HTTP method/origin/body guards and absence of engine clue/answer generation in the browser bundle.
- Keyboard check: callsign Tab moved focus to Create a crew room; Enter activated the help dialog's Understood control. This is a basic check, not a complete accessibility audit.

## Pending / limits

- Clean-checkout verification is recorded below after completion.
- Remote deployment/public signed-out verification pending account access; no public game URL yet.
- Physical devices, unfamiliar-player difficulty testing and true network-disconnection recovery are not tested.
- Phone viewport override was requested, but the browser continued reporting 1280×720. Narrow phone layout is **not verified**; no mobile screenshot is claimed.
- Reduced-motion behavior and actual audio playback have not been tested in the browser.

## Physical-device checklist

- Open the deployed URL in signed-out phone and laptop browsers; join via invite and code.
- Complete a two-device mission, then four-player mission; check clue readability, station tabs, onscreen keyboard and no horizontal scrolling.
- Refresh during play, briefly disconnect/reconnect Wi-Fi, and test captain takeover after 60 seconds.
- Test reduced-motion OS setting, optional sound, and mobile Safari/Chrome.
- Ask unfamiliar players to solve without coaching; note unclear instructions and difficulty.
