// The Starling Archive — everything the player sees.
// Top-down canvas art drawn in code: no image files. The drawing order
// matters for readability: floor, light and shadow, vision cones, cover,
// characters, then the HUD. A guard must read against the floor at a glance.
import { TILE, COLS, ROWS, VIEW_W, VIEW_H, VISION_RANGE, VISION_HALF_ANGLE, COLORS } from './config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  resize() {
    const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
    this.canvas.width = VIEW_W;
    this.canvas.height = VIEW_H;
    this.canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
    this.canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
  }

  drawFloor(world, time) {
    const ctx = this.ctx;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const t = world.grid[y][x];
        const px = x * TILE;
        const py = y * TILE;
        if (t === '#') {
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = COLORS.wallTop;
          ctx.fillRect(px, py, TILE, 6);
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(px, py + TILE - 5, TILE, 5);
        } else {
          ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
          ctx.fillRect(px, py, TILE, TILE);
          if (t === 's') {
            // Shadow nook: dark blue, faint border — one quiet patch, no label spam.
            ctx.fillStyle = COLORS.shadow;
            ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
            ctx.strokeStyle = 'rgba(120,160,220,0.18)';
            ctx.strokeRect(px + 2.5, py + 2.5, TILE - 5, TILE - 5);
            // One label per patch, on its top-left tile, so the hiding spots read.
            const above = y > 0 ? world.grid[y - 1][x] : '#';
            const left = x > 0 ? world.grid[y][x - 1] : '#';
            if (above !== 's' && left !== 's') {
              ctx.fillStyle = 'rgba(140,175,230,0.5)';
              ctx.font = 'bold 10px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('SHADOW', px + TILE / 2, py + TILE / 2 + 3);
            }
          } else if (t === 'o') {
            const pulse = 0.10 + 0.05 * Math.sin(time * 2 + x);
            ctx.fillStyle = `rgba(247, 201, 72, ${pulse})`;
            ctx.fillRect(px, py, TILE, TILE);
            ctx.fillStyle = 'rgba(247, 201, 72, 0.55)';
            ctx.beginPath();
            ctx.arc(px + TILE / 2, py + TILE / 2, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        if (t === 'X') {
          ctx.fillStyle = COLORS.crate;
          ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
          ctx.fillStyle = COLORS.crateTop;
          ctx.fillRect(px + 4, py + 4, TILE - 8, 6);
          ctx.strokeStyle = 'rgba(0,0,0,0.35)';
          ctx.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);
          ctx.beginPath();
          ctx.moveTo(px + 4, py + 4);
          ctx.lineTo(px + TILE - 4, py + TILE - 4);
          ctx.moveTo(px + TILE - 4, py + 4);
          ctx.lineTo(px + 4, py + TILE - 4);
          ctx.stroke();
        }
      }
    }
  }

  drawCone(guard, alarm) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.arc(guard.x, guard.y, VISION_RANGE, guard.facing - VISION_HALF_ANGLE, guard.facing + VISION_HALF_ANGLE);
    ctx.closePath();
    ctx.fillStyle = alarm ? COLORS.coneAlert : COLORS.cone;
    ctx.fill();
    ctx.strokeStyle = alarm ? 'rgba(224,90,78,0.5)' : 'rgba(247,201,72,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  drawRelicsAndExit(world, time) {
    const ctx = this.ctx;
    for (const relic of world.relics) {
      if (relic.taken) continue;
      const bob = Math.sin(time * 3 + relic.bob) * 3;
      ctx.save();
      ctx.translate(relic.x, relic.y + bob);
      ctx.fillStyle = COLORS.relic;
      ctx.beginPath();
      ctx.moveTo(0, -12); ctx.lineTo(9, 0); ctx.lineTo(0, 12); ctx.lineTo(-9, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#7a5c00';
      ctx.beginPath();
      ctx.moveTo(0, -6); ctx.lineTo(4, 0); ctx.lineTo(0, 6); ctx.lineTo(-4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // Exit door: cyan frame, padlock while relics remain.
    const e = world.exit;
    ctx.fillStyle = world.exitOpen ? COLORS.exit : '#3a6b7a';
    ctx.fillRect(e.x - 16, e.y - 16, 32, 32);
    ctx.fillStyle = '#0e1a20';
    ctx.fillRect(e.x - 9, e.y - 9, 18, 18);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(world.exitOpen ? 'EXIT' : 'LOCKED', e.x, e.y - 22);
    if (!world.exitOpen) {
      ctx.fillStyle = COLORS.relic;
      ctx.fillRect(e.x - 4, e.y - 3, 8, 8);
      ctx.strokeStyle = COLORS.relic;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y - 3, 4, Math.PI, 0);
      ctx.stroke();
    }
  }

  drawGuard(guard, alarm) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(guard.x, guard.y);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = alarm ? COLORS.guard : COLORS.guardCalm;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    // Facing tick: the warden's lantern points where he looks.
    ctx.strokeStyle = '#ffe9a8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(guard.facing) * 20, Math.sin(guard.facing) * 20);
    ctx.stroke();
    ctx.fillStyle = '#1c1210';
    ctx.beginPath();
    ctx.arc(-5, -3, 2.5, 0, Math.PI * 2);
    ctx.arc(5, -3, 2.5, 0, Math.PI * 2);
    ctx.fill();
    if (guard.state === 'suspicious' || guard.suspicion > 0.3) {
      ctx.fillStyle = '#ffd94d';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(guard.state === 'investigate' ? '!' : '?', 0, -22);
    }
    if (alarm) {
      ctx.fillStyle = '#ff5a4e';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('!', 0, -22);
    }
    ctx.restore();
  }

  drawPlayer(player, time) {
    const ctx = this.ctx;
    const bob = player.moving ? Math.sin(time * 12) * 2 : 0;
    ctx.save();
    ctx.translate(player.x, player.y + bob);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 10 - bob, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = player.sneaking ? COLORS.playerSneak : COLORS.player;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    // Hood: a darker arc on the side Wren faces.
    ctx.fillStyle = '#1e4d2a';
    ctx.beginPath();
    ctx.arc(Math.cos(Math.atan2(player.dirY, player.dirX)) * 4, Math.sin(Math.atan2(player.dirY, player.dirX)) * 4, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2ead8';
    ctx.beginPath();
    ctx.arc(-4, -3, 2, 0, Math.PI * 2);
    ctx.arc(4, -3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawHud(game) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(8, 12, 18, 0.82)';
    ctx.fillRect(0, 0, VIEW_W, 46);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`THE STARLING ARCHIVE  •  ${game.level.name}`, 14, 29);
    ctx.font = '15px sans-serif';
    ctx.textAlign = 'right';
    const relics = `Relics ${game.world.relicsTotal - game.world.relicsLeft}/${game.world.relicsTotal}`;
    ctx.fillText(relics, VIEW_W - 260, 29);
    ctx.fillText(`Pebbles ${game.player.pebbles}  •  ${game.formatTime(game.elapsed)}`, VIEW_W - 14, 29);
    // Detection meter, centre top: the one number that decides an alarm.
    const w = 220;
    const x = VIEW_W / 2 - w / 2;
    ctx.fillStyle = '#0c1118';
    ctx.fillRect(x, 12, w, 20);
    ctx.fillStyle = game.detection > 66 ? '#e05a4e' : game.detection > 33 ? '#f7c948' : '#58c4dc';
    ctx.fillRect(x + 2, 14, (w - 4) * (game.detection / 100), 16);
    ctx.strokeStyle = 'rgba(242,234,216,0.5)';
    ctx.strokeRect(x, 12, w, 20);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.alarm ? 'ALARM!' : game.detection > 1 ? 'SEEN' : 'UNSEEN', VIEW_W / 2, 26);
    // Bottom hint line.
    ctx.fillStyle = 'rgba(8, 12, 18, 0.7)';
    ctx.fillRect(0, VIEW_H - 30, VIEW_W, 30);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      'WASD / arrows move  •  Shift sneak  •  Click throw a pebble  •  P pause  •  M mute  •  Hide in SHADOW, avoid lamplight',
      VIEW_W / 2, VIEW_H - 11,
    );
  }

  drawCenterPanel(title, lines, accent) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(5, 8, 12, 0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = 'rgba(16, 22, 30, 0.95)';
    ctx.strokeStyle = accent || COLORS.light;
    ctx.lineWidth = 2;
    const w = 620;
    const h = 130 + lines.length * 30;
    const x = VIEW_W / 2 - w / 2;
    const y = VIEW_H / 2 - h / 2;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = accent || COLORS.text;
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, VIEW_W / 2, y + 52);
    ctx.fillStyle = COLORS.text;
    ctx.font = '16px sans-serif';
    lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, y + 92 + i * 30));
  }

  drawTitle(time) {
    const ctx = this.ctx;
    ctx.fillStyle = '#10151d';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // A quiet archive hall behind the title: shelves and one lamp cone.
    ctx.fillStyle = '#1c232d';
    for (let i = 0; i < 8; i++) ctx.fillRect(60 + i * 150, 120, 110, 420);
    ctx.fillStyle = 'rgba(247, 201, 72, 0.12)';
    ctx.beginPath();
    ctx.moveTo(640, 90);
    ctx.lineTo(480, 620);
    ctx.lineTo(800, 620);
    ctx.closePath();
    ctx.fill();
    const glow = 0.7 + 0.3 * Math.sin(time * 1.5);
    ctx.fillStyle = `rgba(247, 201, 72, ${0.75 * glow})`;
    ctx.beginPath();
    ctx.arc(640, 90, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 56px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE STARLING ARCHIVE', VIEW_W / 2, 300);
    ctx.fillStyle = COLORS.light;
    ctx.font = '20px sans-serif';
    ctx.fillText('A stealth game in three nights', VIEW_W / 2, 340);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '16px sans-serif';
    ctx.fillText('You are Wren, night courier. Steal the relics. Never be seen.', VIEW_W / 2, 380);
    ctx.fillText('Guards patrol with vision cones — crates block their sight, shadow hides you.', VIEW_W / 2, 406);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Press ENTER to begin  •  WASD move  •  Shift sneak  •  Click throw a pebble', VIEW_W / 2, 470);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '14px sans-serif';
    ctx.fillText('3 levels  •  5 wardens at most  •  Ghost rating if no alarm ever sounds', VIEW_W / 2, 510);
  }

  drawWorld(game, time) {
    this.drawFloor(game.world, time);
    for (const guard of game.guards) this.drawCone(guard, game.alarm);
    this.drawRelicsAndExit(game.world, time);
    for (const guard of game.guards) this.drawGuard(guard, game.alarm);
    this.drawPlayer(game.player, time);
    this.drawHud(game);
  }
}
