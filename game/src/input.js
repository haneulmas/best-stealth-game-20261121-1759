// The Starling Archive: keyboard and mouse input.
// WASD / arrows to move, Shift to sneak, click to throw a pebble,
// M to mute, P or Esc to pause, Enter to start.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.clickQueue = [];
    this.pressed = new Set();
    this.canvas = canvas;
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if (!e.repeat) this.pressed.add(e.key.toLowerCase());
      this.keys.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.clickQueue.push({
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      });
    });
    window.addEventListener('blur', () => this.keys.clear());
  }

  axis() {
    let x = 0;
    let y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    return { x, y };
  }

  get sneaking() { return this.keys.has('shift'); }

  wasPressed(key) {
    const hit = this.pressed.has(key);
    if (hit) this.pressed.delete(key);
    return hit;
  }

  takeClick() { return this.clickQueue.shift() || null; }

  endFrame() { this.pressed.clear(); }
}
