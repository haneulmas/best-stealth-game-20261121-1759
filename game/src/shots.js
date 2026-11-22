// The Starling Archive: deterministic screenshot staging.
// ?shot=start  title screen
// ?shot=play   mid-level: Wren behind a crate, a warden's cone sweeping past
// ?shot=alert  alarm up, a warden chasing, detection meter full
// ?shot=complete  level-complete panel after the Reading Room
// The shots are real renders of the game's own code, staged, never edited.
import { LEVELS } from './levels.js';

export function applyShot(game, params) {
  const shot = params.get('shot');
  if (!shot) return false;
  if (shot === 'start') {
    game.state = 'title';
    return true;
  }
  if (shot === 'play') {
    game.start();
    game.loadLevel(1); // The Stacks: four patrols, shelves, shadow nooks
    game.state = 'playing';
    // Wren crouched in shadow, a cone sweeping the patch's edge, a pebble
    // still ringing where it landed. Almost seen, not caught.
    game.player.x = 20 * 40 + 20;
    game.player.y = 14 * 40 + 20;
    game.player.sneaking = true;
    game.guards[0].x = 14 * 40 + 20;
    game.guards[0].y = 8 * 40 + 20;
    game.guards[0].facing = Math.PI / 2;
    game.guards[1].x = 20 * 40 + 20;
    game.guards[1].y = 6 * 40 + 20;
    game.guards[1].facing = Math.PI;
    // Spread the other two wardens so no two cones sit on each other.
    game.guards[2].x = 10 * 40 + 20;
    game.guards[2].y = 13 * 40 + 20;
    game.guards[2].facing = -Math.PI / 2;
    game.guards[3].x = 25 * 40 + 20;
    game.guards[3].y = 11 * 40 + 20;
    game.guards[3].facing = Math.PI;
    // Frozen mid-ring: the shot is staged, so the age never advances.
    game.pebbleRing = { x: 18 * 40 + 20, y: 12 * 40 + 20, age: 0.45 };
    // One smoke spent, the cloud still hanging between Wren and the cone.
    game.world.smoke = { x: 18 * 40 + 20, y: 13 * 40 + 20, age: 1.0 };
    game.player.smokes = 1;
    game.detection = 38;
    game.message = 'A pebble rings in the dark. The warden turns.';
    game.messageTimer = 99;
    return true;
  }
  if (shot === 'alert') {
    game.start();
    game.loadLevel(0);
    game.state = 'playing';
    game.player.x = 12 * 40 + 20;
    game.player.y = 8 * 40 + 20;
    game.guards[0].x = 10 * 40 + 20;
    game.guards[0].y = 8 * 40 + 20;
    game.guards[0].facing = 0;
    game.guards[0].state = 'chase';
    // A second warden closes from the right: Wren caught between two cones.
    game.guards[1].x = 17 * 40 + 20;
    game.guards[1].y = 8 * 40 + 20;
    game.guards[1].facing = Math.PI;
    game.guards[1].state = 'chase';
    game.detection = 100;
    game.alarm = true;
    game.alarmTimer = 5;
    game.alarms = 1;
    game.message = 'SPOTTED! Run for shadow and break line of sight!';
    game.messageTimer = 99;
    return true;
  }
  if (shot === 'complete') {
    game.start();
    game.loadLevel(0);
    game.state = 'levelComplete';
    game.stateTimer = 0.5;
    game.world.relics.forEach((r) => { r.taken = true; });
    return true;
  }
  return false;
}

export function shotLevelName(shot) {
  return shot === 'play' ? LEVELS[1].name : LEVELS[0].name;
}
