// The Starling Archive: bootstrap and frame loop.
import { Game } from './game.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = new Renderer(canvas);
const input = new Input(canvas);
const sounds = new SoundBank();
const game = new Game(sounds);
window.__game = game; // play-test hook: lets a test read state, nothing else uses it

const params = new URLSearchParams(window.location.search);
const stagedShot = applyShot(game, params);

renderer.resize();
window.addEventListener('resize', () => renderer.resize());

let last = performance.now();
let time = 0;
// Ambient motion (murmuration, lamp pulse, relic bob) freezes when the
// player pauses or prefers reduced motion. P is the pause control for it.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!prefersReducedMotion && game.state !== 'paused') time += dt;
  if (!stagedShot) game.update(dt, input);
  else if (game.state === 'playing') {
    // Staged shots are frozen mid-action so the screenshot is stable:
    // guards hold their pose, the meter holds its value.
    game.elapsed += dt;
  }
  input.endFrame();

  const ctx = renderer.ctx;
  if (game.state === 'title') {
    renderer.drawTitle(time);
    status.textContent = 'The Starling Archive title screen. Press Enter to begin.';
  } else if (game.state === 'playing' || game.state === 'paused') {
    renderer.drawWorld(game, time);
    if (game.messageTimer > 0 && game.message) {
      ctx.fillStyle = 'rgba(8, 12, 18, 0.8)';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      const w = ctx.measureText(game.message).width + 28;
      ctx.fillRect((1280 - w) / 2, 56, w, 30);
      ctx.fillStyle = '#f2ead8';
      ctx.fillText(game.message, 640, 76);
    }
    ctx.fillStyle = '#f2ead8';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Lives ${'♥'.repeat(game.lives)}${'♡'.repeat(3 - game.lives)}`, 14, 700);
    ctx.textAlign = 'right';
    ctx.fillText(`Rating so far: ${game.rating()}`, 1266, 700);
    if (game.state === 'paused') {
      renderer.drawCenterPanel('PAUSED', ['Press P or Enter to keep playing.'], '#58c4dc');
    }
    status.textContent = `${game.level.name}. Detection ${Math.round(game.detection)} percent. ${game.alarm ? 'Alarm!' : 'Unseen.'}`;
  } else if (game.state === 'levelComplete') {
    renderer.drawWorld(game, time);
    renderer.drawCenterPanel('LEVEL CLEAR', [
      `${game.level.name}. All relics stolen, unseen enough.`,
      `Alarms so far: ${game.alarms}  •  Caught: ${game.catches}  •  Time ${game.formatTime(game.elapsed)}`,
      'Next level loading…',
    ], '#7ee081');
  } else if (game.state === 'caught') {
    renderer.drawWorld(game, time);
    renderer.drawCenterPanel('CAUGHT!', [
      'A warden grabbed Wren. The level restarts.',
      `Lives left: ${game.lives}  •  Press Enter to try again.`,
    ], '#e05a4e');
  } else if (game.state === 'victory') {
    renderer.drawCenterPanel(`THE ARCHIVE IS YOURS: ${game.rating()}`, [
      'All five levels cleared. Every relic is Wren\u2019s now.',
      `Alarms: ${game.alarms}  •  Caught: ${game.catches}  •  Time ${game.formatTime(game.elapsed)}`,
      'Press Enter to play again.',
    ], '#ffd94d');
  } else if (game.state === 'gameover') {
    renderer.drawCenterPanel('THE ARCHIVE KEEPS ITS SECRETS', [
      'Three catches. The wardens change the locks.',
      `You reached ${game.level.name}. Press Enter to try again.`,
    ], '#e05a4e');
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
