# The Velvet Vault

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/arnesarizky/velvet-vault-heist/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/arnesarizky/velvet-vault-heist/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

An original top-down 2D heist game, made for the make.fun **best-heist-game-20261122-0559** bounty. Three jobs, one crew, no alarms — if you can help it.

You are the thief. Sneak through the Velvet Gallery, the Bank Vault and the Penthouse: read the guards' patrols and vision cones, time the sweeping security cameras, grab the target loot, and slip out the green EXIT to the getaway van before the alarm hits 100%.

## The loop

1. **Plan** — every room has several routes: the carpeted main hall (fast, exposed), the side corridor behind the pillars, and the dark vent crawlspaces where cones barely reach. Click anywhere to drop a planning ping.
2. **Infiltrate** — guards patrol waypoint loops and chase when they spot you; cameras sweep back and forth. Sneaking (Shift) and vents halve how far they can see you.
3. **Grab** — hold **E** beside a case. Locked cases take longer to crack, or open instantly with a lockpick.
4. **Escape** — once the target loot is taken, the EXIT opens. Reach it to bank the job's loot plus a time bonus, then move on to the next job.

## Alarm

Being seen by a guard or a camera raises the alarm (guards raise it faster); hiding makes it decay. At 55% the crew is suspicious; at 100% you are caught — and the caught screen names exactly who spotted you.

## Tools (keys 1 / 2 / 3)

- **1 — Lockpick** (x2, free): opens a locked case instantly.
- **2 — Smoke bomb** (x2, $250 of your loot): blinds guards and cameras for 4 seconds.
- **3 — EMP pulse** (x1, $400 of your loot): freezes every camera for 6 seconds.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Move |
| Shift | Sneak (slower, harder to spot) |
| E (hold) | Grab loot |
| 1 / 2 / 3 | Lockpick / smoke bomb / EMP |
| Click | Drop a planning ping on the floor |
| P / Esc | Pause |
| Enter | Start / retry |

## Scoring

Loot dollars + a time bonus per job (par time beaten = $10/second), across all three jobs. The best total is saved in your browser.

## Play it

No build step, no network — every file the game loads lives under `game/`. Serve it and open it in desktop Chrome:

```sh
node serve.ts
# open http://localhost:8080
```

Sound is synthesized with WebAudio oscillators only; there are no audio files.

## Structure

- `game/src/config.js` — sizes, speeds, alarm math, tool costs
- `game/src/random.js` — deterministic seeded random
- `game/src/levels.js` — the three job floor plans
- `game/src/guards.js` — patrols, vision cones, line of sight
- `game/src/cameras.js` — sweeping cameras
- `game/src/loot.js` — grabbing and locked cases
- `game/src/audio.js` — synthesized WebAudio sounds
- `game/src/world.js` — game state, alarm, tools, win/caught rules
- `game/src/render.js` — canvas drawing, HUD, screens
- `game/src/shots.js` — deterministic screenshot scenes
- `game/src/input.js` — keyboard + mouse
- `game/src/main.js` — boot and the game loop

## License

MIT — see [LICENSE](LICENSE).
