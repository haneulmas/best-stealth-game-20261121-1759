// The Starling Archive: the four levels.
// Each level is built from rectangles instead of hand-counted ASCII maps,
// so a wall is never one tile off. Legend used by the builder:
//   '#' wall (blocks movement and sight)   'X' crate (blocks movement and sight)
//   's' shadow patch (walkable, hides you) 'o' lamplight (walkable, bright)
//   'R' relic to steal   'E' exit door   'P' where Wren starts
import { COLS, ROWS } from './config.js';

function blankGrid() {
  const grid = [];
  for (let y = 0; y < ROWS; y++) grid.push(new Array(COLS).fill('.'));
  for (let x = 0; x < COLS; x++) { grid[0][x] = '#'; grid[ROWS - 1][x] = '#'; }
  for (let y = 0; y < ROWS; y++) { grid[y][0] = '#'; grid[y][COLS - 1] = '#'; }
  return grid;
}

function paint(grid, x, y, w, h, ch) {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++)
      if (xx > 0 && yy > 0 && xx < COLS - 1 && yy < ROWS - 1) grid[yy][xx] = ch;
}

function buildLevel(def) {
  const grid = blankGrid();
  for (const [x, y, w, h, ch] of def.paint) paint(grid, x, y, w, h, ch);
  for (const [x, y] of def.relics) grid[y][x] = 'R';
  grid[def.exit[1]][def.exit[0]] = 'E';
  grid[def.start[1]][def.start[0]] = 'P';
  return {
    name: def.name,
    subtitle: def.subtitle,
    grid: grid.map((row) => row.join('')),
    guards: def.guards,
    start: def.start,
    exit: def.exit,
    relics: def.relics,
    pebbles: 3,
  };
}

// Guard patrols are tile waypoints the guard walks in a loop.
export const LEVELS = [
  buildLevel({
    name: 'Level 1: The Reading Room',
    subtitle: 'Two wardens. Learn their patrols, take both relics, slip out.',
    start: [2, 15],
    exit: [29, 2],
    relics: [[15, 3], [26, 14]],
    paint: [
      [6, 2, 1, 6, '#'], [6, 11, 1, 5, '#'], // reading-room pillars
      [13, 5, 5, 1, 'X'], [20, 9, 4, 1, 'X'], [9, 13, 5, 1, 'X'], // crate cover
      [24, 3, 3, 2, 'X'],
      [3, 5, 3, 3, 's'], [17, 12, 4, 3, 's'], [25, 6, 3, 3, 's'], // shadow nooks
      [10, 3, 3, 2, 'o'], [22, 13, 3, 2, 'o'], [15, 8, 2, 2, 'o'], // lamplight
    ],
    guards: [
      { spawn: [10, 8], waypoints: [[10, 8], [10, 3], [20, 3], [20, 8]], speed: 88 },
      { spawn: [22, 12], waypoints: [[22, 12], [22, 6], [14, 6], [14, 12]], speed: 88 },
    ],
  }),
  buildLevel({
    name: 'Level 2: The Stacks',
    subtitle: 'Four wardens between the shelves. Pebbles distract. Click to throw.',
    start: [2, 2],
    exit: [29, 15],
    relics: [[8, 8], [16, 14], [25, 4]],
    paint: [
      [5, 3, 1, 11, '#'], [11, 3, 1, 11, '#'], [17, 3, 1, 11, '#'], [23, 3, 1, 11, '#'],
      [7, 6, 2, 1, 'X'], [14, 10, 2, 1, 'X'], [20, 6, 2, 1, 'X'], [26, 11, 2, 1, 'X'],
      [3, 12, 3, 3, 's'], [13, 2, 3, 2, 's'], [19, 13, 4, 3, 's'], [27, 7, 2, 3, 's'],
      [8, 2, 2, 2, 'o'], [15, 8, 2, 2, 'o'], [24, 14, 2, 2, 'o'], [28, 3, 2, 2, 'o'],
    ],
    guards: [
      { spawn: [8, 15], waypoints: [[8, 15], [8, 4], [14, 4], [14, 15]], speed: 96 },
      { spawn: [20, 2], waypoints: [[20, 2], [20, 15], [26, 15], [26, 2]], speed: 96 },
      { spawn: [15, 8], waypoints: [[15, 8], [15, 13], [10, 13], [10, 8]], speed: 92 },
      { spawn: [27, 9], waypoints: [[27, 9], [27, 14], [22, 14], [22, 9]], speed: 100 },
    ],
  }),
  buildLevel({
    name: 'Level 3: The Vault',
    subtitle: 'Five wardens, tight patrols. Ghost it: no alarm, no catch.',
    start: [2, 9],
    exit: [29, 9],
    relics: [[8, 3], [16, 15], [24, 3]],
    paint: [
      [6, 2, 6, 1, '#'], [19, 2, 6, 1, '#'],
      [6, 15, 6, 1, '#'], [19, 15, 6, 1, '#'],
      [13, 5, 1, 8, '#'], [18, 5, 1, 8, '#'],
      [9, 7, 2, 1, 'X'], [22, 10, 2, 1, 'X'], [15, 3, 2, 1, 'X'], [15, 14, 2, 1, 'X'],
      [3, 3, 3, 3, 's'], [27, 13, 3, 3, 's'], [14, 8, 4, 2, 's'], [6, 12, 3, 2, 's'],
      [10, 12, 2, 2, 'o'], [21, 5, 2, 2, 'o'], [26, 8, 2, 2, 'o'], [5, 8, 2, 2, 'o'],
    ],
    guards: [
      { spawn: [10, 5], waypoints: [[10, 5], [10, 12], [15, 12], [15, 5]], speed: 104 },
      { spawn: [21, 5], waypoints: [[21, 5], [21, 12], [16, 12], [16, 5]], speed: 104 },
      { spawn: [15, 8], waypoints: [[15, 8], [15, 3], [24, 3], [24, 8]], speed: 100 },
      { spawn: [8, 14], waypoints: [[8, 14], [8, 8], [4, 8], [4, 14]], speed: 100 },
      { spawn: [24, 14], waypoints: [[24, 14], [24, 8], [28, 8], [28, 14]], speed: 108 },
    ],
  }),
  buildLevel({
    name: 'Level 4: The Ledger',
    subtitle: 'Six wardens, four relics. The ledger never forgets.',
    start: [2, 2],
    exit: [29, 15],
    relics: [[11, 4], [20, 14], [27, 3], [12, 13]],
    paint: [
      [7, 3, 1, 6, '#'], [7, 11, 1, 5, '#'], // ledger columns, gaps at rows 9-10
      [15, 3, 1, 5, '#'], [15, 10, 1, 6, '#'], // centre column, gap at rows 8-9
      [23, 3, 1, 6, '#'], [23, 11, 1, 5, '#'], // right column, gaps at rows 9-10
      [11, 6, 2, 1, 'X'], [19, 12, 2, 1, 'X'], [25, 5, 2, 1, 'X'], [5, 9, 2, 1, 'X'], // crate cover
      [3, 12, 3, 3, 's'], [10, 2, 3, 2, 's'], [18, 13, 4, 3, 's'], [27, 7, 2, 3, 's'], // shadow nooks
      [8, 2, 2, 2, 'o'], [20, 8, 2, 2, 'o'], [12, 14, 2, 2, 'o'], [28, 3, 2, 2, 'o'], // lamplight
    ],
    guards: [
      { spawn: [10, 15], waypoints: [[10, 15], [10, 4], [16, 4], [16, 15]], speed: 100 },
      { spawn: [21, 2], waypoints: [[21, 2], [21, 15], [27, 15], [27, 2]], speed: 104 },
      { spawn: [13, 8], waypoints: [[13, 8], [13, 13], [19, 13], [19, 8]], speed: 96 },
      { spawn: [26, 9], waypoints: [[26, 9], [26, 14], [21, 14], [21, 9]], speed: 100 },
      { spawn: [5, 5], waypoints: [[5, 5], [5, 13], [9, 13], [9, 5]], speed: 96 },
      { spawn: [24, 6], waypoints: [[24, 6], [24, 11], [18, 11], [18, 6]], speed: 104 },
    ],
  }),
];

export function levelCount() { return LEVELS.length; }
