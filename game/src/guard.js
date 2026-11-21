// The Starling Archive — the warden AI.
// States: patrol (walk waypoints), suspicious (pause and look),
// investigate (walk to a thrown pebble or a heard footstep),
// chase (run at the player during an alarm), return (walk home).
// A guard never teleports: every state is a walk, so a patrol can be learned.
import { TILE, GUARD_SPEED, GUARD_CHASE_SPEED, GUARD_RADIUS } from './config.js';
import { angleTo, blocksMovement } from './vision.js';

function tileCenter(tx, ty) { return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 }; }

// Breadth-first path over walkable tiles, so a guard walks around walls
// and crates instead of pushing against them. Patrols stay learnable:
// the waypoints are fixed, only the route between them is computed.
export function findPath(world, sx, sy, tx, ty) {
  const cols = world.grid[0].length;
  const rows = world.grid.length;
  const walkable = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows && world.grid[y][x] !== '#' && world.grid[y][x] !== 'X';
  if (!walkable(tx, ty)) return null;
  const key = (x, y) => y * cols + x;
  const prev = new Map();
  const seen = new Set([key(sx, sy)]);
  const queue = [[sx, sy]];
  while (queue.length) {
    const [x, y] = queue.shift();
    if (x === tx && y === ty) {
      const path = [];
      let cur = key(tx, ty);
      while (cur !== key(sx, sy)) {
        path.unshift(tileCenter(cur % cols, Math.floor(cur / cols)));
        cur = prev.get(cur);
      }
      return path;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (walkable(nx, ny) && !seen.has(key(nx, ny))) {
        seen.add(key(nx, ny));
        prev.set(key(nx, ny), key(x, y));
        queue.push([nx, ny]);
      }
    }
  }
  return null;
}

export class Guard {
  constructor(def) {
    const s = tileCenter(def.spawn[0], def.spawn[1]);
    this.x = s.x;
    this.y = s.y;
    this.home = { x: s.x, y: s.y };
    this.waypoints = def.waypoints.map(([tx, ty]) => tileCenter(tx, ty));
    this.wpIndex = 1 % this.waypoints.length;
    this.facing = 0;
    this.state = 'patrol';
    this.speed = def.speed || GUARD_SPEED;
    this.pauseTimer = 0;
    this.target = null;
    this.suspicion = 0; // 0..1, shown as "?" above the guard
    this.chaseTimer = 0;
    this.stepTimer = 0;
    this.path = null; // tile centres the guard is walking, recomputed on demand
    this.pathTarget = null;
    this.repathTimer = 0;
  }

  // Walk the computed path toward a tile; returns true on arrival.
  followPath(tx, ty, speed, dt, world) {
    const ttx = Math.floor(tx / TILE);
    const tty = Math.floor(ty / TILE);
    const key = `${ttx},${tty}`;
    if (!this.path || this.pathTarget !== key) {
      const fromX = Math.floor(this.x / TILE);
      const fromY = Math.floor(this.y / TILE);
      this.path = findPath(world, fromX, fromY, ttx, tty);
      this.pathTarget = key;
      if (!this.path) return true; // unreachable: treat as arrived, do not stall
    }
    if (this.path.length === 0) return true;
    const next = this.path[0];
    const arrived = this.moveToward(next.x, next.y, speed, dt, world);
    if (arrived) this.path.shift();
    return this.path.length === 0;
  }

  moveToward(tx, ty, speed, dt, world) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return true;
    const step = Math.min(dist, speed * dt);
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    this.facing = Math.atan2(dy, dx);
    if (!blocksMovement(world, nx, this.y)) this.x = nx;
    if (!blocksMovement(world, this.x, ny)) this.y = ny;
    return dist <= step + 1;
  }

  update(dt, world, player, alarmActive, sounds) {
    this.stepTimer -= dt;
    if (this.state === 'chase') {
      this.chaseTimer -= dt;
      this.repathTimer -= dt;
      if (this.repathTimer <= 0) { this.path = null; this.repathTimer = 0.5; }
      const arrived = this.followPath(player.x, player.y, GUARD_CHASE_SPEED, dt, world);
      if (arrived || this.chaseTimer <= 0) {
        if (!alarmActive) { this.state = 'return'; this.target = null; this.path = null; }
      }
      return;
    }
    if (alarmActive) {
      this.state = 'chase';
      this.chaseTimer = 3;
      this.path = null;
      return;
    }
    if (this.state === 'suspicious') {
      this.pauseTimer -= dt;
      this.facing += dt * 1.6; // look around
      if (this.pauseTimer <= 0) { this.state = 'patrol'; this.suspicion = 0; }
      return;
    }
    if (this.state === 'investigate' && this.target) {
      const arrived = this.followPath(this.target.x, this.target.y, this.speed * 1.25, dt, world);
      if (arrived) {
        this.state = 'suspicious';
        this.pauseTimer = 1.6;
        this.target = null;
        this.path = null;
      }
      return;
    }
    if (this.state === 'return') {
      const arrived = this.followPath(this.home.x, this.home.y, this.speed, dt, world);
      if (arrived) { this.state = 'patrol'; this.wpIndex = 1 % this.waypoints.length; this.path = null; }
      return;
    }
    // patrol
    if (this.pauseTimer > 0) {
      this.pauseTimer -= dt;
      return;
    }
    const wp = this.waypoints[this.wpIndex];
    const arrived = this.followPath(wp.x, wp.y, this.speed, dt, world);
    if (arrived) {
      this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
      this.path = null;
      this.pauseTimer = 0.7; // a beat at each waypoint, so patrols read clearly
    }
    if (sounds && this.stepTimer <= 0) {
      this.stepTimer = 0.55;
      // Guard footsteps are quieter than the player's; the game plays them
      // only when a guard is near, so sound tells you where a guard is.
      const d = Math.hypot(player.x - this.x, player.y - this.y);
      if (d < 320) sounds.noise(0.05, 0.04, 500);
    }
  }

  hearNoise(x, y, world) {
    if (this.state === 'chase') return;
    const d = Math.hypot(x - this.x, y - this.y);
    if (d < 260) {
      this.state = 'investigate';
      this.target = { x, y };
      this.path = null;
      this.suspicion = Math.max(this.suspicion, 0.6);
    }
  }

  growSuspicious(amount) {
    if (this.state === 'chase') return;
    this.suspicion = Math.min(1, this.suspicion + amount);
    if (this.suspicion > 0.55 && this.state === 'patrol') {
      this.state = 'suspicious';
      this.pauseTimer = 1.2;
    }
  }

  radius() { return GUARD_RADIUS; }
}
