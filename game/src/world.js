// The Starling Archive: the level as the game sees it.
// Turns a level's grid into tiles, relics and the exit, and answers
// the questions the other systems ask: is this solid, is this shadow.
import { TILE } from './config.js';

export class World {
  constructor(level) {
    this.level = level;
    this.grid = level.grid;
    this.relics = level.relics.map(([tx, ty]) => ({
      x: tx * TILE + TILE / 2,
      y: ty * TILE + TILE / 2,
      taken: false,
      bob: Math.random() * Math.PI * 2,
    }));
    this.exit = { x: level.exit[0] * TILE + TILE / 2, y: level.exit[1] * TILE + TILE / 2 };
    this.start = level.start;
    this.smoke = null; // the one smoke cloud, if Wren dropped one (vision checks it)
    this.snuffed = new Set(); // lamps Wren pinched out, "x,y" keys (vision and render both read it)
  }

  tileAt(px, py) {
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);
    if (tx < 0 || ty < 0 || ty >= this.grid.length || tx >= this.grid[0].length) return '#';
    return this.grid[ty][tx];
  }

  get relicsLeft() { return this.relics.filter((r) => !r.taken).length; }
  get relicsTotal() { return this.relics.length; }
  get exitOpen() { return this.relicsLeft === 0; }

  collectRelics(player) {
    for (const relic of this.relics) {
      if (!relic.taken && Math.hypot(player.x - relic.x, player.y - relic.y) < 26) {
        relic.taken = true;
        return relic;
      }
    }
    return null;
  }

  atExit(player) {
    return this.exitOpen && Math.hypot(player.x - this.exit.x, player.y - this.exit.y) < 28;
  }
}
