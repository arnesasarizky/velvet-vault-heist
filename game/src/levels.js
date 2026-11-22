// The three jobs of The Velvet Vault. Each job is one floor plan: outer walls, interior
// walls that block sight, shadow vents (slow but hidden), guards on patrol loops, sweeping
// cameras, loot cases and a getaway exit. Several routes cross every room: the carpeted
// main hall, the vent crawlspace along the edge, and the side corridor behind the pillars.
import { JOB_NAMES } from './config.js';

function wall(x, y, w, h) { return { x, y, w, h }; }
function lootItem(id, x, y, kind, value, label, locked) {
  return { id, x, y, kind, value, label, locked: !!locked, taken: false, grab: 0 };
}
function guardSpot(x, y, waypoints, pause) {
  return { x, y, waypoints, pause: pause ?? 1.2 };
}
function cameraSpot(x, y, baseAngle, sweep) {
  return { x, y, baseAngle, sweep: sweep ?? 0.9 };
}

// Shared frame: thick outer walls with a gap at the getaway door on the left edge.
function frame(exitY) {
  return [
    wall(0, 84, 1280, 14), wall(0, 706, 1280, 14), wall(1266, 84, 14, 622),
    wall(0, 84, 14, exitY - 84), wall(0, exitY + 56, 14, 706 - exitY - 56),
  ];
}

export function buildJob(index, random) {
  const jitter = () => (random() - 0.5) * 24;
  if (index === 0) {
    return {
      name: JOB_NAMES[0], parSeconds: 150,
      start: { x: 60, y: 380 }, exit: { x: 20, y: 380, w: 26, h: 56 },
      walls: [...frame(380),
        wall(300, 84, 18, 260), wall(300, 420, 18, 286),
        wall(640, 84, 18, 200), wall(640, 360, 18, 346),
        wall(940, 84, 18, 300), wall(940, 460, 18, 246),
        wall(480, 520, 180, 18), wall(820, 200, 160, 18)],
      vents: [{ x: 40, y: 640, w: 1200, h: 46 }, { x: 1180, y: 110, w: 70, h: 480 }],
      guards: [
        guardSpot(480, 220, [[480, 220], [480, 620], [820, 620], [820, 220]]),
        guardSpot(1080, 500, [[1080, 500], [1080, 160], [760, 160]]),
      ],
      cameras: [
        cameraSpot(318, 130, 0.4, 1.0), cameraSpot(958, 640, Math.PI + 0.4, 1.1),
      ],
      loot: [
        lootItem('painting', 500 + jitter(), 150, 'painting', 1200, 'Velvet Portrait', false),
        lootItem('vase', 800 + jitter(), 620, 'vase', 800, 'Porcelain Vase', false),
        lootItem('diamond', 1120, 300, 'diamond', 5000, 'The Velvet Diamond', true),
      ],
      targetId: 'diamond',
    };
  }
  if (index === 1) {
    return {
      name: JOB_NAMES[1], parSeconds: 180,
      start: { x: 60, y: 180 }, exit: { x: 20, y: 180, w: 26, h: 56 },
      walls: [...frame(180),
        wall(280, 84, 18, 200), wall(280, 360, 18, 346),
        wall(560, 84, 18, 260), wall(560, 420, 18, 286),
        wall(840, 84, 18, 200), wall(840, 360, 18, 346),
        wall(1000, 300, 180, 18), wall(400, 560, 220, 18), wall(700, 180, 18, 140)],
      vents: [{ x: 40, y: 640, w: 1200, h: 46 }, { x: 40, y: 110, w: 900, h: 40 }],
      guards: [
        guardSpot(420, 300, [[420, 300], [420, 620], [700, 620], [700, 300]]),
        guardSpot(960, 180, [[960, 180], [960, 620], [1180, 620], [1180, 180]]),
        guardSpot(700, 500, [[700, 500], [1100, 500], [1100, 620]]),
      ],
      cameras: [
        cameraSpot(298, 640, -0.5, 1.0), cameraSpot(578, 130, 0.6, 0.9),
        cameraSpot(858, 640, Math.PI - 0.5, 1.2),
      ],
      loot: [
        lootItem('bars', 420 + jitter(), 150, 'bars', 2000, 'Gold Bars', false),
        lootItem('ledger', 700 + jitter(), 620, 'ledger', 900, 'Black Ledger', false),
        lootItem('ruby', 1120, 220, 'ruby', 3500, 'Bank Ruby', true),
        lootItem('vault', 1150, 560, 'vault', 8000, 'The Main Vault', true),
      ],
      targetId: 'vault',
    };
  }
  return {
    name: JOB_NAMES[2], parSeconds: 210,
    start: { x: 60, y: 600 }, exit: { x: 20, y: 600, w: 26, h: 56 },
    walls: [...frame(600),
      wall(260, 84, 18, 260), wall(260, 420, 18, 286),
      wall(520, 84, 18, 200), wall(520, 360, 18, 346),
      wall(780, 84, 18, 260), wall(780, 420, 18, 286),
      wall(1040, 84, 18, 200), wall(1040, 360, 18, 346),
      wall(380, 300, 200, 18), wall(900, 520, 180, 18), wall(640, 180, 160, 18)],
    vents: [{ x: 40, y: 640, w: 1200, h: 46 }, { x: 1180, y: 110, w: 70, h: 480 }, { x: 40, y: 110, w: 700, h: 40 }],
    guards: [
      guardSpot(400, 200, [[400, 200], [400, 620], [640, 620], [640, 200]]),
      guardSpot(900, 620, [[900, 620], [900, 200], [1160, 200], [1160, 620]]),
      guardSpot(640, 480, [[640, 480], [900, 480], [900, 620]]),
      guardSpot(1160, 400, [[1160, 400], [760, 400], [760, 620]]),
    ],
    cameras: [
      cameraSpot(278, 130, 0.5, 1.0), cameraSpot(538, 640, -0.6, 1.1),
      cameraSpot(798, 130, 0.5, 0.9), cameraSpot(1058, 640, Math.PI + 0.5, 1.2),
    ],
    loot: [
      lootItem('crown', 400 + jitter(), 150, 'crown', 4000, 'Velvet Crown', false),
      lootItem('pearls', 650 + jitter(), 620, 'pearls', 1500, 'Pearl Rope', false),
      lootItem('watch', 1150, 150, 'watch', 2500, 'Moonphase Watch', true),
      lootItem('deed', 900 + jitter(), 300, 'deed', 1800, 'Penthouse Deed', false),
      lootItem('heart', 1180, 480, 'heart', 12000, 'Heart of Velvet', true),
    ],
    targetId: 'heart',
  };
}

export function jobCount() { return JOB_NAMES.length; }
