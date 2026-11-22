// The Starling Archive: sight and hearing.
// A guard sees you only when you are inside the vision cone AND the straight
// line between you has no wall or crate in the way. Cover really works.
import { TILE, VISION_RANGE, VISION_HALF_ANGLE, SMOKE_RADIUS } from './config.js';

export function tileAt(world, px, py) {
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);
  if (tx < 0 || ty < 0 || ty >= world.grid.length || tx >= world.grid[0].length) return '#';
  return world.grid[ty][tx];
}

export function blocksSight(world, px, py) {
  const t = tileAt(world, px, py);
  return t === '#' || t === 'X';
}

export function blocksMovement(world, px, py) {
  return blocksSight(world, px, py);
}

// Walk the line in small steps; any sight-blocking tile ends the view.
// A smoke cloud blinds both ways: a line through it sees nothing.
export function hasLineOfSight(world, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = ax + dx * t;
    const py = ay + dy * t;
    if (blocksSight(world, px, py)) return false;
    if (world.smoke && Math.hypot(px - world.smoke.x, py - world.smoke.y) < SMOKE_RADIUS) return false;
  }
  return true;
}

export function angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function canSee(world, guard, px, py) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > VISION_RANGE) return { seen: false, dist };
  const diff = Math.abs(angleDiff(angleTo(guard.x, guard.y, px, py), guard.facing));
  if (diff > VISION_HALF_ANGLE) return { seen: false, dist };
  if (!hasLineOfSight(world, guard.x, guard.y, px, py)) return { seen: false, dist };
  return { seen: true, dist };
}

export function isShadowTile(world, px, py) { return tileAt(world, px, py) === 's'; }
export function isLitTile(world, px, py) { return tileAt(world, px, py) === 'o'; }
