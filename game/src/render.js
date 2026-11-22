// The Starling Archive: everything the player sees.
// Top-down canvas art drawn in code: no image files. Draw order keeps
// mechanics readable: floor, light and shadow, cones, cover, characters, HUD.
import { TILE, COLS, ROWS, VIEW_W, VIEW_H, VISION_RANGE, VISION_HALF_ANGLE, PEBBLE_RING_SECONDS, SMOKE_SECONDS, SMOKE_RADIUS, COLORS } from './config.js';

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
          // Book-spine stripes: the walls are shelves, not bare stone.
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(px, py, TILE, TILE);
          const spines = ['#5b3f7d', '#2c6b6b', '#8a6a35', '#4a3a6b'];
          for (let s = 0; s < 4; s++) {
            ctx.fillStyle = spines[(x * 3 + y * 5 + s) % 4];
            ctx.globalAlpha = 0.55;
            ctx.fillRect(px + 3 + s * 9, py + 4, 6, TILE - 8);
          }
          ctx.globalAlpha = 1;
          ctx.fillStyle = COLORS.wallTop;
          ctx.fillRect(px, py, TILE, 6);
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(px, py + TILE - 5, TILE, 5);
        } else {
          ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
          ctx.fillRect(px, py, TILE, TILE);
          // Gold grout and the odd feather give the floor texture without noise.
          ctx.strokeStyle = 'rgba(247, 201, 72, 0.07)';
          ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
          if ((x * 7 + y * 13) % 23 === 0) {
            ctx.strokeStyle = 'rgba(247, 201, 72, 0.16)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(px + TILE / 2, py + TILE / 2 + 6, 7, Math.PI * 1.15, Math.PI * 1.85);
            ctx.stroke();
          }
          if (t === 's') {
            // Shadow must read as a hiding spot at a glance.
            ctx.fillStyle = COLORS.shadow;
            ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
            ctx.strokeStyle = 'rgba(88, 196, 220, 0.4)';
            ctx.strokeRect(px + 2.5, py + 2.5, TILE - 5, TILE - 5);
            // One label per patch, on its top-left tile, so the hiding spots read.
            const above = y > 0 ? world.grid[y - 1][x] : '#';
            const left = x > 0 ? world.grid[y][x - 1] : '#';
            if (above !== 's' && left !== 's') {
              ctx.fillStyle = 'rgba(120, 220, 240, 0.65)';
              ctx.font = 'bold 10px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('SHADOW', px + TILE / 2, py + TILE / 2 + 3);
            }
          } else if (t === 'o') {
            // Lamplight flickers: two sines out of phase, so the bright
            // tiles are never quite steady and the light/dark choice reads.
            const pulse = 0.10 + 0.05 * Math.sin(time * 2 + x) + 0.05 * Math.sin(time * 6.7 + x * 2.3);
            ctx.fillStyle = `rgba(247, 201, 72, ${pulse})`;
            ctx.fillRect(px, py, TILE, TILE);
            ctx.fillStyle = 'rgba(247, 201, 72, 0.10)';
            ctx.beginPath();
            ctx.arc(px + TILE / 2, py + TILE / 2, 16 + 6 * Math.sin(time * 6.7 + x), 0, Math.PI * 2);
            ctx.fill();
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

  // The archive watches: giant eyes in the side walls, turned 90
  // degrees so they fit the wall column exactly. Never on play tiles,
  // never under the HUD or hint bar: the top and bottom rows are covered.
  // Their pupils track Wren, the one signature no other stealth game has.
  // Two more eyes watch from the shelves of each level. When the alarm
  // sounds the archive wakes: more eyes open, and every iris burns red.
  drawEyes(game) {
    const ctx = this.ctx;
    const spots = [
      { x: 20, y: 6 * TILE + 20, vertical: true },
      { x: COLS * TILE - 20, y: 11 * TILE + 20, vertical: true },
    ];
    // Shelf eyes, one or two per level, each on a wall that level really
    // has, so no eye ever floats over the floor.
    const shelfEyes = [
      [{ x: 6 * TILE + 20, y: 4 * TILE + 20, vertical: true }],
      [
        { x: 11 * TILE + 20, y: 7 * TILE + 20, vertical: true },
        { x: 17 * TILE + 20, y: 7 * TILE + 20, vertical: true },
      ],
      [{ x: 13 * TILE + 20, y: 8 * TILE + 20, vertical: true }],
      [{ x: 15 * TILE + 20, y: 5 * TILE + 20, vertical: true }],
    ][game.levelIndex];
    if (shelfEyes) spots.push(...shelfEyes);
    // Alarm eyes: only while the alarm sounds, on walls the level has.
    if (game.alarm) {
      const alarmEyes = [
        [{ x: 6 * TILE + 20, y: 13 * TILE + 20, vertical: true }],
        [
          { x: 5 * TILE + 20, y: 10 * TILE + 20, vertical: true },
          { x: 23 * TILE + 20, y: 5 * TILE + 20, vertical: true },
        ],
        [{ x: 18 * TILE + 20, y: 8 * TILE + 20, vertical: true }],
        [{ x: 23 * TILE + 20, y: 13 * TILE + 20, vertical: true }],
      ][game.levelIndex];
      if (alarmEyes) spots.push(...alarmEyes);
    }
    const iris = game.alarm ? '#e05a4e' : COLORS.eyeIris;
    for (const s of spots) {
      const dx = game.player.x - s.x;
      const dy = game.player.y - s.y;
      const d = Math.hypot(dx, dy) || 1;
      // Local eye coords: long axis follows the wall, so the pupil's
      // long-axis offset tracks the player's offset along the wall.
      const px = (dy / d) * 14;
      const py = (-dx / d) * 6;
      ctx.save();
      ctx.translate(s.x, s.y);
      if (s.vertical) ctx.rotate(Math.PI / 2);
      // Sclera.
      ctx.fillStyle = COLORS.eyeSclera;
      ctx.beginPath();
      ctx.ellipse(0, 0, 72, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      // Pupil follows Wren.
      ctx.fillStyle = iris;
      ctx.beginPath();
      ctx.arc(px, py, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0b0b12';
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(px - 2, py - 2, 1.6, 0, Math.PI * 2);
      ctx.fill();
      // Upper lid: the wall's own violet arc over the eye.
      ctx.strokeStyle = COLORS.wall;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 72, 16, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // A starling murmuration sweeping the hall on one slow sine band.
  // Denser and lower than the first pass, so it reads in the cover shot
  // instead of hiding at the top. Still translucent, still atmosphere.
  drawMurmuration(time) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(13, 21, 18, 0.7)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 56; i++) {
      const x = (((i * 97 + time * 30) % (VIEW_W + 240)) + VIEW_W + 240) % (VIEW_W + 240) - 120;
      const y = 170 + 90 * Math.sin(x / 220 + time * 0.4) + (i % 5) * 12;
      const flap = Math.sin(time * 6 + i * 1.3) * 3;
      const s = 6 + (i % 3) * 3;
      ctx.beginPath();
      ctx.moveTo(x - s, y - flap);
      ctx.lineTo(x, y + 2);
      ctx.lineTo(x + s, y - flap);
      ctx.stroke();
    }
    ctx.restore();
  }

  // The pebble's landing ring: it expands and fades, so the player sees
  // the noise a thrown pebble makes and which wardens it pulls away.
  drawPebbleRing(game) {
    const ring = game.pebbleRing;
    if (!ring) return;
    const t = Math.min(1, ring.age / PEBBLE_RING_SECONDS);
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = `rgba(247, 201, 72, ${0.85 * (1 - t)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, 14 + t * 90, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = `rgba(247, 201, 72, ${0.9 * (1 - t)})`;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // The smoke cloud: overlapping violet-grey puffs, translucent so the
  // player still sees Wren, thick enough to read as a hiding place.
  drawSmoke(game, time) {
    const smoke = game.world.smoke;
    if (!smoke) return;
    const t = Math.min(1, smoke.age / SMOKE_SECONDS);
    const ctx = this.ctx;
    ctx.save();
    const puffs = [
      [0, 0, 42], [-34, 12, 30], [32, 14, 32], [-14, -26, 28], [18, -24, 26],
    ];
    for (const [dx, dy, r] of puffs) {
      const wobble = Math.sin(time * 2 + dx) * 3;
      ctx.fillStyle = `rgba(120, 116, 150, ${0.34 * (1 - t)})`;
      ctx.beginPath();
      ctx.arc(smoke.x + dx + wobble, smoke.y + dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = `rgba(200, 196, 220, ${0.5 * (1 - t)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(smoke.x, smoke.y, SMOKE_RADIUS * (0.9 + 0.1 * Math.sin(time * 2)), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
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
    // The exit must read as locked until every relic is taken.
    const e = world.exit;
    ctx.fillStyle = 'rgba(88, 196, 220, 0.18)';
    ctx.beginPath();
    ctx.arc(e.x, e.y, 26, 0, Math.PI * 2);
    ctx.fill();
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
    ctx.fillText(`Pebbles ${game.player.pebbles}  •  Smoke ${game.player.smokes}  •  ${game.formatTime(game.elapsed)}`, VIEW_W - 14, 29);
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
    ctx.fillStyle = 'rgba(8, 12, 18, 0.7)';
    ctx.fillRect(0, VIEW_H - 30, VIEW_W, 30);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      'WASD / arrows move  •  Shift sneak  •  Click throw a pebble  •  Q smoke  •  P pause  •  M mute  •  Hide in SHADOW, avoid lamplight',
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
    ctx.fillStyle = '#0b1e24';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // The title carries the signature: one giant eye, the murmuration, violet shelves.
    ctx.fillStyle = '#2c1e42';
    for (let i = 0; i < 8; i++) ctx.fillRect(60 + i * 150, 120, 110, 420);
    ctx.fillStyle = 'rgba(123, 79, 208, 0.25)';
    for (let i = 0; i < 8; i++) {
      for (let s = 0; s < 4; s++) ctx.fillRect(66 + i * 150 + s * 26, 130, 14, 400);
    }
    ctx.fillStyle = 'rgba(247, 201, 72, 0.10)';
    ctx.beginPath();
    ctx.ellipse(640, 210, 340, 95, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.eyeSclera;
    ctx.beginPath();
    ctx.ellipse(640, 210, 300, 72, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.eyeIris;
    ctx.beginPath();
    ctx.arc(640, 210, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b0b12';
    ctx.beginPath();
    ctx.arc(640, 210, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(628, 196, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3d2b52';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.ellipse(640, 210, 300, 72, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
    this.drawMurmuration(time);
    const glow = 0.7 + 0.3 * Math.sin(time * 1.5);
    ctx.fillStyle = `rgba(247, 201, 72, ${0.75 * glow})`;
    ctx.beginPath();
    ctx.arc(640, 90, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.light;
    ctx.font = 'bold 56px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE STARLING ARCHIVE', VIEW_W / 2, 300);
    ctx.fillStyle = '#58c4dc';
    ctx.font = '20px sans-serif';
    ctx.fillText('A stealth game in four nights. The archive is watching', VIEW_W / 2, 340);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '16px sans-serif';
    ctx.fillText('You are Wren, night courier. Steal the relics. Never be seen.', VIEW_W / 2, 380);
    ctx.fillText('Guards patrol with vision cones. Crates block their sight, shadow hides you.', VIEW_W / 2, 406);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Press ENTER to begin  •  WASD move  •  Shift sneak  •  Click throw a pebble  •  Q smoke', VIEW_W / 2, 470);
    ctx.fillStyle = COLORS.muted;
    ctx.font = '14px sans-serif';
    ctx.fillText('4 levels  •  6 wardens at most  •  Ghost rating if no alarm ever sounds', VIEW_W / 2, 510);
  }

  drawWorld(game, time) {
    this.drawFloor(game.world, time);
    this.drawEyes(game);
    for (const guard of game.guards) this.drawCone(guard, game.alarm);
    this.drawMurmuration(time);
    this.drawRelicsAndExit(game.world, time);
    this.drawSmoke(game, time);
    this.drawPebbleRing(game);
    for (const guard of game.guards) this.drawGuard(guard, game.alarm);
    this.drawPlayer(game.player, time);
    this.drawHud(game);
  }
}
