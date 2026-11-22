// The Starling Archive: the game itself.
// State machine: title -> playing -> (paused | levelComplete | caught)
// -> victory. Detection is one shared meter: any guard who sees Wren
// fills it; at 100 the alarm sounds, guards chase, and a catch costs
// a life and restarts the level.
import {
  DETECT_BASE, DETECT_CLOSE_BONUS, DETECT_RUN_BONUS, DETECT_LIGHT_BONUS,
  DETECT_SHADOW_FACTOR, DETECT_DECAY, ALARM_SECONDS,
  HEARING_RANGE, SNEAK_HEARING_RANGE, PEBBLE_RING_SECONDS,
  SMOKE_SECONDS,
} from './config.js';
import { LEVELS } from './levels.js';
import { World } from './world.js';
import { Player } from './player.js';
import { Guard } from './guard.js';
import { canSee, isShadowTile, isLitTile } from './vision.js';

export class Game {
  constructor(sounds) {
    this.sounds = sounds;
    this.state = 'title'; // title | playing | paused | levelComplete | caught | victory | gameover
    this.levelIndex = 0;
    this.level = LEVELS[0];
    this.world = new World(this.level);
    this.player = new Player(this.level.start);
    this.guards = this.level.guards.map((g) => new Guard(g));
    this.detection = 0;
    this.alarm = false;
    this.alarmTimer = 0;
    this.alarms = 0;
    this.catches = 0;
    this.lives = 3;
    this.elapsed = 0;
    this.levelTime = 0;
    this.message = '';
    this.messageTimer = 0;
    this.stateTimer = 0;
    this.pebbleRing = null; // where the last pebble landed, while it rings
  }

  get levelName() { return this.level.name; }

  loadLevel(index) {
    this.levelIndex = index;
    this.level = LEVELS[index];
    this.world = new World(this.level);
    this.player = new Player(this.level.start);
    this.guards = this.level.guards.map((g) => new Guard(g));
    this.detection = 0;
    this.alarm = false;
    this.alarmTimer = 0;
    this.levelTime = 0;
    this.message = this.level.subtitle;
    this.messageTimer = 4;
    this.pebbleRing = null;
  }

  start() {
    this.lives = 3;
    this.alarms = 0;
    this.catches = 0;
    this.elapsed = 0;
    this.loadLevel(0);
    this.state = 'playing';
    if (this.sounds) { this.sounds.ensure(); this.sounds.startDrone(); }
  }

  formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  rating() {
    if (this.alarms === 0 && this.catches === 0) return 'GHOST';
    if (this.alarms <= 1 && this.catches === 0) return 'SHADOW';
    if (this.catches <= 1) return 'SPOTTED';
    return 'LOUD';
  }

  update(dt, input) {
    if (this.state === 'title') {
      if (input.wasPressed('enter')) { this.sounds.click(); this.start(); }
      return;
    }
    if (this.state === 'playing') {
      if (input.wasPressed('p') || input.wasPressed('escape')) { this.state = 'paused'; return; }
      if (input.wasPressed('m') && this.sounds) this.sounds.toggleMute();
      this.elapsed += dt;
      this.levelTime += dt;
      this.messageTimer -= dt;
      const pebble = this.player.update(dt, input, this.world, this.sounds);
      // A pebble rings where it lands, so the distraction reads: wardens
      // in earshot turn toward the ring, and the player sees why.
      if (pebble) {
        this.pebbleRing = { x: pebble.x, y: pebble.y, age: 0 };
        for (const g of this.guards) g.hearNoise(pebble.x, pebble.y, this.world);
      }
      if (this.pebbleRing) {
        this.pebbleRing.age += dt;
        if (this.pebbleRing.age > PEBBLE_RING_SECONDS) this.pebbleRing = null;
      }
      // Smoke (Q): a cloud at Wren's feet no warden can see through, for
      // crossing open floor with no shadow. Two per level, so it is spent
      // on purpose, never by accident: it needs its own key.
      if (input.wasPressed('q') && this.player.smokes > 0 && !this.world.smoke) {
        this.player.smokes -= 1;
        this.world.smoke = { x: this.player.x, y: this.player.y, age: 0 };
        this.sounds.smoke();
      }
      if (this.world.smoke) {
        this.world.smoke.age += dt;
        if (this.world.smoke.age > SMOKE_SECONDS) this.world.smoke = null;
      }
      // Running footsteps can be heard: a guard turns to investigate.
      if (this.player.footstepLoud) {
        for (const g of this.guards) {
          const d = Math.hypot(g.x - this.player.x, g.y - this.player.y);
          if (d < HEARING_RANGE && Math.random() < dt * 2) g.hearNoise(this.player.x, this.player.y, this.world);
        }
      }
      this.updateDetection(dt);
      for (const g of this.guards) g.update(dt, this.world, this.player, this.alarm, this.sounds);
      if (this.alarm) {
        this.alarmTimer -= dt;
        if (this.alarmTimer <= 0) { this.alarm = false; this.detection = 40; }
      }
      const relic = this.world.collectRelics(this.player);
      if (relic) {
        this.sounds.pickup();
        this.message = this.world.relicsLeft === 0 ? 'All relics taken. Reach the EXIT!' : `Relic taken. ${this.world.relicsLeft} left.`;
        this.messageTimer = 3;
      }
      if (this.world.atExit(this.player)) {
        this.sounds.levelClear();
        if (this.levelIndex + 1 >= LEVELS.length) {
          this.state = 'victory';
          this.sounds.victory();
        } else {
          this.state = 'levelComplete';
          this.stateTimer = 0;
        }
        return;
      }
      // Caught: a chasing guard touches Wren.
      for (const g of this.guards) {
        if (this.alarm && Math.hypot(g.x - this.player.x, g.y - this.player.y) < 26) {
          this.catches += 1;
          this.lives -= 1;
          this.sounds.caught();
          if (this.lives <= 0) { this.state = 'gameover'; }
          else { this.state = 'caught'; this.stateTimer = 0; }
          return;
        }
      }
      return;
    }
    if (this.state === 'paused') {
      if (input.wasPressed('p') || input.wasPressed('escape') || input.wasPressed('enter')) this.state = 'playing';
      return;
    }
    if (this.state === 'levelComplete') {
      this.stateTimer += dt;
      if (this.stateTimer > 2.2 || input.wasPressed('enter')) {
        this.loadLevel(this.levelIndex + 1);
        this.state = 'playing';
      }
      return;
    }
    if (this.state === 'caught') {
      this.stateTimer += dt;
      if (this.stateTimer > 1.8 || input.wasPressed('enter')) {
        this.loadLevel(this.levelIndex);
        this.state = 'playing';
      }
      return;
    }
    if (this.state === 'victory' || this.state === 'gameover') {
      if (input.wasPressed('enter')) {
        this.levelIndex = 0;
        this.start();
      }
    }
  }

  updateDetection(dt) {
    let seen = false;
    let rate = 0;
    for (const g of this.guards) {
      const { seen: s, dist } = canSee(this.world, g, this.player.x, this.player.y);
      if (!s) continue;
      seen = true;
      let r = DETECT_BASE;
      if (dist < 110) r += DETECT_CLOSE_BONUS * (1 - dist / 110);
      if (this.player.running) r += DETECT_RUN_BONUS;
      if (isLitTile(this.world, this.player.x, this.player.y)) r += DETECT_LIGHT_BONUS;
      if (isShadowTile(this.world, this.player.x, this.player.y)) r *= DETECT_SHADOW_FACTOR;
      if (this.player.sneaking) r *= 0.55;
      rate = Math.max(rate, r);
      // A guard who sees Wren is sure of it: no look-around, the meter does
      // the work. Suspicion ("?") is for half-glimpses and heard footsteps.
      g.suspicion = 0;
      // Hearing: a running player very close is noticed even off-cone.
      const d = Math.hypot(g.x - this.player.x, g.y - this.player.y);
      if (this.player.running && d < SNEAK_HEARING_RANGE) g.growSuspicious(dt);
    }
    if (seen) {
      this.detection = Math.min(100, this.detection + rate * dt);
      if (this.detection >= 100 && !this.alarm) {
        this.alarm = true;
        this.alarmTimer = ALARM_SECONDS;
        this.alarms += 1;
        this.sounds.spotted();
        this.sounds.alarm();
        this.message = 'SPOTTED! Run for shadow and break line of sight!';
        this.messageTimer = 3;
      }
    } else {
      this.detection = Math.max(0, this.detection - DETECT_DECAY * dt);
      // Lost sight after a scare: the nearest warden stops and looks around.
      if (this.detection > 20) {
        let nearest = null;
        let best = Infinity;
        for (const g of this.guards) {
          const d = Math.hypot(g.x - this.player.x, g.y - this.player.y);
          if (d < best) { best = d; nearest = g; }
        }
        if (nearest && best < 320) nearest.growSuspicious(dt * 0.5);
      }
    }
  }
}
