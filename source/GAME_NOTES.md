# Signal Lost

Playable contest prototype for Joshua Berkoh. Built with ChatGPT Work.

## Scope
- 2–4 real participants; six-character room codes; no application accounts.
- Solo practice controls all four stations.
- Three mission stages, nine-minute server deadline, 20-second mismatch penalty.
- Three distinct mechanics: evidence elimination, telemetry calculation, and signal decoding. Each new mission independently varies all 12 station settings. Existing pre-update rooms preserve their original clues.
- Private role evidence, server-owned answers, compare-and-swap room updates.
- Refresh reconnect on the same tab; captain takeover after 60 seconds disconnected.
- Shared decision replay, free hints, optional confirmation tones, reduced motion.
- Room state expires from use after 24 hours. Leaving a lobby or completed mission releases the seat and transfers captaincy when needed.
- Players communicate in person or through their own voice call; no built-in voice chat.
- The captain can remove a crewmate from the lobby or during a mission (locks clear and stations are reassigned). Joins no longer reset ready state, and callsigns must be unique in a room.
- Room creation, joins and invalid sessions use bounded IP-hash allowances. Lock/unlock limits belong to an authenticated room/player, so Wi-Fi peers have independent gameplay quotas. Admission/count/reset is one atomic D1 operation; invalid sessions never create gameplay buckets and receive uniform errors.
- A captain kick pauses new joins, persisting across rematches. Existing crew can reconnect. Only the captain can deliberately reopen admission from the lobby, with a confirmation warning that anyone with the room code can return. This does not implement permanent bans without player identity.

## Verification
Run `node --experimental-strip-types tests/game.test.mjs`.
Twelve complete missions cover every option for each station at 1–4 players. Tests independently solve all three mechanics from the player-visible clues. Also covers legacy-room compatibility, role authorization, token redaction, penalties, stale actions, reconnect identity, captain transfer, timeout, rematch and released seats.
After building, run `node tests/worker.test.mjs` to exercise the actual production Worker in an isolated local runtime with real local D1 and concurrent requests. No hosted rooms are modified.
TypeScript check: `node node_modules/typescript/bin/tsc --noEmit`.

## Contest roadmap approved October 7, 2026
- October 7–10: concept, full in-app requirements review, multiplayer proof.
- October 11–17: strengthen puzzle variety, roles and ending.
- October 18–23: test with unfamiliar players and refine communication and difficulty.
- October 24–27: final visual/device/accessibility checks, cover image and submission copy.
- October 28: target submission after user review. Official PDF deadline: October 30, 11:59 PM Pacific; public mission advertises October 31.

## Remaining review
This is a first playable prototype, not a promise of contest placement. The three mechanics need real-player difficulty and communication testing. Verify the full signed-in Handshake mission requirements. Run real phone/laptop playtests and visual browser QA. Submission itself has not been performed.
