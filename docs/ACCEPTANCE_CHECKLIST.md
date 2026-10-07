# Acceptance checklist

## Passed before this source export
- TypeScript validation and production build.
- Twelve engine scenarios covering 1–4 players and all station option positions.
- Independent solving of evidence, telemetry and codebook puzzles from player-visible information.
- Legacy room compatibility, permissions, token redaction, penalties, stale actions, captain takeover, timeouts, rematches and leaving rooms.
- Actual built Worker with local D1: four independent sessions, concurrent commits through all three stages, persisted outcomes, rematch and replacement players.

## Cowork must verify after migration
- [ ] Fresh installation and build without original environment paths/tools.
- [ ] Tests run in the migrated runtime and new database.
- [ ] Public signed-out URL loads and serves all assets.
- [ ] Two separate physical devices complete a mission; four independent sessions remain synchronized.
- [ ] Reconnect, mobile keyboard, narrow screens, keyboard focus and reduced motion behave correctly.
- [ ] No hidden answer table or other player's private evidence reaches the browser.
- [ ] Leaving/rematching, invalid codes, full rooms and timeouts behave correctly.
- [ ] GitHub deployment is reproducible and secrets are excluded.
- [ ] Exported source is committed and URLs/test results are returned to the user.

## Current limitations and behaviors to preserve or deliberately improve
- Browser visual QA and physical-device tests were not completed in the original environment.
- Updates currently use polling, not WebSockets.
- Refresh reconnect is tied to sessionStorage in the same browser tab; cross-device account recovery is not implemented.
- Players use their own voice call or talk in person; built-in voice chat is absent.
- Leaving during active play is disallowed to avoid changing station ownership mid-puzzle. A disconnected non-captain's station can remain unavailable until they reconnect; design an explicit recovery policy if improving this.
- Rooms become inaccessible after 24 hours; this is not automatic physical deletion of database rows.
- Puzzle difficulty needs real-player testing. The implementation is a contest prototype, not a completed contest entry.
- There is no live AI requirement, login system, payment system or ranking leaderboard.
