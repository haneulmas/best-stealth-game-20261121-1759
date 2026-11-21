// The Starling Archive: Wren, the night courier.
import {
  TILE, PLAYER_SPEED, PLAYER_SNEAK_SPEED, PLAYER_RADIUS,
  PEBBLE_RANGE,
} from './config.js';
import { blocksMovement } from './vision.js';

export class Player {
  constructor(start) {
    this.x = start[0] * TILE + TILE / 2;
    this.y = start[1] * TILE + TILE / 2;
    this.dirX = 0;
    this.dirY = 1;
    this.moving = false;
    this.sneaking = false;
    this.running = false;
    this.pebbles = 3;
    this.stepTimer = 0;
    this.footstepLoud = false;
  }

  reset(start) {
    this.x = start[0] * TILE + TILE / 2;
    this.y = start[1] * TILE + TILE / 2;
    this.dirX = 0;
    this.dirY = 1;
    this.moving = false;
    this.pebbles = 3;
  }

  update(dt, input, world, sounds) {
    const { x, y } = input.axis();
    const len = Math.hypot(x, y) || 1;
    this.moving = x !== 0 || y !== 0;
    this.sneaking = input.sneaking && this.moving;
    this.running = this.moving && !this.sneaking;
    const speed = this.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_SPEED;
    if (this.moving) {
      this.dirX = x / len;
      this.dirY = y / len;
      const nx = this.x + (x / len) * speed * dt;
      const ny = this.y + (y / len) * speed * dt;
      const r = PLAYER_RADIUS;
      if (!blocksMovement(world, nx + Math.sign(x) * r, this.y)) this.x = nx;
      if (!blocksMovement(world, this.x, ny + Math.sign(y) * r)) this.y = ny;
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = this.sneaking ? 0.42 : 0.3;
        this.footstepLoud = this.running;
        if (sounds) sounds.footstep(this.sneaking);
      }
    } else {
      this.footstepLoud = false;
    }
    const click = input.takeClick();
    if (click && this.pebbles > 0) {
      const dx = click.x - this.x;
      const dy = click.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 12) {
        const land = Math.min(dist, PEBBLE_RANGE);
        this.pebbles -= 1;
        if (sounds) sounds.pebble();
        return { x: this.x + (dx / dist) * land, y: this.y + (dy / dist) * land };
      }
    }
    return null;
  }

  radius() { return PLAYER_RADIUS; }
}
