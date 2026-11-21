# The Starling Archive — a stealth game

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/haneulmas/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/haneulmas/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

Entry for the [make.fun bounty "Make the best stealth game"](https://make.fun/bounty/best-stealth-game-20261121-1759): a complete, original top-down stealth game that runs offline in a desktop browser from static files.

You are Wren, night courier. Steal the relics from the Starling Archive and reach the exit unseen, past wardens who patrol with vision cones. Crates block their sight, shadow hides you, lamplight gives you away. Throw a pebble (click) to pull a guard off his patrol. Get spotted and the alarm sounds — break line of sight before a warden catches you. Three levels, three lives, and a Ghost rating if no alarm ever sounds.

## Play

```sh
node serve.ts
# open http://localhost:8080
```

WASD / arrows move, Shift sneaks (slower, quieter, harder to see), click throws a pebble, P pauses, M mutes. All sound is synthesized with WebAudio — no audio files, no network.

## Layout

- `main.ts`: Node 22 entrypoint (stdlib only) — copies `game/` and `screenshots/` to `/output` and writes `dossier.json`
- `game/index.html` + `game/src/`: the game, split by job — `config.js` tuning, `levels.js` the three levels, `vision.js` sight and hearing, `guard.js` warden AI, `player.js` Wren, `world.js` tiles and relics, `audio.js` synthesized sound, `input.js` keyboard and mouse, `render.js` canvas art, `game.js` state and detection, `shots.js` screenshot staging, `main.js` loop
- `vendor/makefun-game.ts`: the kit's dossier library, unchanged
- `screenshots/`: 3–4 real renders of the game's own code

## License

MIT. See `LICENSE`.
