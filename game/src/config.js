// The Starling Archive: shared tuning numbers for the whole game.
// One place for every speed, range and rate, so balancing is a single edit.
export const TILE = 40;
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const COLS = 32;
export const ROWS = 18;

export const PLAYER_SPEED = 178; // px per second, walking
export const PLAYER_SNEAK_SPEED = 104; // px per second, Shift held
export const PLAYER_RADIUS = 13;
export const GUARD_SPEED = 92; // patrol
export const GUARD_CHASE_SPEED = 168; // alarm chase
export const GUARD_RADIUS = 14;

export const VISION_RANGE = 265; // guard sight distance, px
export const VISION_HALF_ANGLE = 0.62; // radians, ~35 degrees each side
export const HEARING_RANGE = 150; // running footsteps heard this far
export const SNEAK_HEARING_RANGE = 55;

export const DETECT_BASE = 46; // meter per second, player in cone at mid range
export const DETECT_CLOSE_BONUS = 55; // extra when very close
export const DETECT_RUN_BONUS = 26; // extra when the player runs
export const DETECT_LIGHT_BONUS = 22; // extra standing in lamplight
export const DETECT_SHADOW_FACTOR = 0.12; // hiding in shadow slows it this much
export const DETECT_DECAY = 30; // meter per second when unseen
export const ALARM_SECONDS = 6; // how long a full meter keeps the alarm up
export const PEBBLE_RANGE = 340; // how far a thrown pebble can land
export const PEBBLE_COUNT = 3; // per level
export const PEBBLE_RING_SECONDS = 1.4; // how long the landing ring shows
export const SMOKE_COUNT = 2; // per level, Q drops one at Wren's feet
export const SMOKE_SECONDS = 4; // how long a smoke cloud blinds wardens
export const SMOKE_RADIUS = 60; // px, the cloud no guard can see through

export const COLORS = {
  // The archive watches: deep teal stone, violet shelf-walls, gold light.
  floor: '#14282e',
  floorAlt: '#122420',
  wall: '#3d2b52',
  wallTop: '#6b4a8f',
  crate: '#8a6a35',
  crateTop: '#b8934f',
  shadow: '#0a2e33',
  light: '#f7c948',
  player: '#7ee081',
  playerSneak: '#4da85a',
  guard: '#e05a4e',
  guardCalm: '#d98a3d',
  cone: 'rgba(247, 201, 72, 0.20)',
  coneAlert: 'rgba(224, 90, 78, 0.30)',
  relic: '#ffd94d',
  exit: '#58c4dc',
  text: '#f2ead8',
  muted: '#b8ad94',
  eyeSclera: '#f2e6c8',
  eyeIris: '#7b4fd0',
};
