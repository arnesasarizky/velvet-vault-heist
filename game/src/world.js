// The world: one job at a time, the thief, the alarm, the tools and the win/caught rules.
// Detection feeds the alarm; the alarm at 100 means caught, and the guard or camera that
// last saw the thief is named on the caught screen so the loss feels fair.
import { ALARM, GUARD, STEP, THIEF, TOOLS } from './config.js';
import { buildJob, jobCount } from './levels.js';
import { createGuard, updateGuard, moveWithWalls, circleHitsWalls } from './guards.js';
import { createCamera, updateCamera, cameraSeesThief } from './cameras.js';
import { grabProgress, nearestLoot } from './loot.js';

export const EVENT_CAUGHT = 1;
export const EVENT_JOB_DONE = 2;
export const EVENT_LOOT = 4;
export const EVENT_SPOTTED = 8;

export function createWorld(random) {
  const world = {
    random, jobIndex: 0, job: null, guards: [], cameras: [],
    thief: { x: 60, y: 380, radius: THIEF.radius, sneaking: false, facing: 0 },
    alarm: 0, loot: 0, grabbed: 0, targetTaken: false, time: 0, jobTime: 0,
    smokeLeft: 0, tools: { lockpick: 2, smoke: 2, emp: 1 },
    spottedBy: null, lastEvent: 0, over: false, won: false, totalLoot: 0,
    jobScores: [], started: false,
  };
  loadJob(world, 0);
  return world;
}

export function loadJob(world, index) {
  world.jobIndex = index;
  world.job = buildJob(index, world.random);
  world.guards = world.job.guards.map((spot, i) => createGuard(spot, i));
  world.cameras = world.job.cameras.map((spot, i) => createCamera(spot, i));
  world.thief.x = world.job.start.x;
  world.thief.y = world.job.start.y;
  world.thief.facing = 0;
  world.alarm = 0; world.grabbed = 0; world.targetTaken = false;
  world.jobTime = 0; world.smokeLeft = 0; world.spottedBy = null;
  world.tools = { lockpick: 2, smoke: 2, emp: 1 };
}

export function resetRun(world) {
  world.loot = 0; world.totalLoot = 0; world.jobScores = [];
  world.over = false; world.won = false; world.time = 0;
  loadJob(world, 0);
  world.started = true;
}

function inVent(state, x, y) {
  for (const v of state.job.vents) {
    if (x >= v.x && x <= v.x + v.w && y >= v.y && y <= v.y + v.h) return true;
  }
  return false;
}

export function useTool(world, name, audio) {
  if (world.tools[name] <= 0) return false;
  if (name === 'lockpick') {
    const item = nearestLoot(world, 48);
    if (!item || !item.locked || item.taken) return false;
    item.taken = true;
    world.loot += item.value;
    world.grabbed += 1;
    if (item.id === world.job.targetId) world.targetTaken = true;
    world.tools.lockpick -= 1;
    if (audio) audio.vault();
    return true;
  }
  if (name === 'smoke') {
    if (world.loot < TOOLS.smoke.cost) return false;
    world.loot -= TOOLS.smoke.cost;
    world.smokeLeft = 4;
    world.tools.smoke -= 1;
    if (audio) audio.smoke();
    return true;
  }
  if (name === 'emp') {
    if (world.loot < TOOLS.emp.cost) return false;
    world.loot -= TOOLS.emp.cost;
    for (const camera of world.cameras) camera.frozen = 6;
    world.tools.emp -= 1;
    if (audio) audio.emp();
    return true;
  }
  return false;
}

// Advance the world one fixed step. `move` is a unit vector, `holdingGrab` the E key.
export function stepWorld(world, dt, move, holdingGrab, audio) {
  world.lastEvent = 0;
  if (world.over) return world.lastEvent;
  world.time += dt;
  world.jobTime += dt;
  if (world.smokeLeft > 0) world.smokeLeft -= dt;

  const thief = world.thief;
  const vent = inVent(world, thief.x, thief.y);
  // `thief.sneaking` is set by the caller from the Shift key before each step.
  const speed = thief.sneaking ? THIEF.sneakSpeed : THIEF.walkSpeed;
  if (move.x !== 0 || move.y !== 0) {
    thief.facing = Math.atan2(move.y, move.x);
    moveWithWalls(thief, move.x * speed * dt, move.y * speed * dt, world.job.walls);
  }

  let seenByGuard = null;
  let seenByCamera = null;
  for (const guard of world.guards) {
    updateGuard(guard, dt, thief, world.job.walls, vent, world.smokeLeft);
    if (guard.seen) seenByGuard = guard;
  }
  for (const camera of world.cameras) {
    updateCamera(camera, dt, world.time);
    camera.seen = cameraSeesThief(camera, thief, world.job.walls, vent) && world.smokeLeft <= 0;
    if (camera.seen) seenByCamera = camera;
  }

  const before = world.loot;
  const item = grabProgress(world, dt, holdingGrab);
  if (world.loot > before) {
    world.lastEvent |= EVENT_LOOT;
    if (audio) audio.coin();
  }

  const spotted = seenByGuard !== null || seenByCamera !== null;
  if (spotted) {
    world.spottedBy = seenByGuard ? `Guard ${seenByGuard.index + 1}` : `Camera ${seenByCamera.index + 1}`;
    world.alarm += (seenByGuard ? ALARM.riseGuard : ALARM.riseCamera) * dt;
    if (world.lastEvent === 0 || true) world.lastEvent |= EVENT_SPOTTED;
    if (audio) audio.alarmTick(world.alarm);
  } else {
    world.alarm = Math.max(0, world.alarm - ALARM.decay * dt);
  }
  if (world.alarm >= ALARM.caughtAt) {
    world.alarm = ALARM.caughtAt;
    world.over = true;
    world.won = false;
    world.lastEvent |= EVENT_CAUGHT;
    if (audio) audio.caught();
    return world.lastEvent;
  }

  // Getaway: the exit opens once the job's target loot is taken.
  const exit = world.job.exit;
  if (world.targetTaken && thief.x < exit.x + exit.w + 6 && thief.y > exit.y - 6 && thief.y < exit.y + exit.h + 6) {
    const timeBonus = Math.max(0, Math.round((world.job.parSeconds - world.jobTime) * 10));
    const score = world.loot + timeBonus;
    world.jobScores.push({ job: world.job.name, loot: world.loot, timeBonus, score });
    world.totalLoot += world.loot;
    if (audio) audio.win();
    if (world.jobIndex + 1 >= jobCount()) {
      world.over = true;
      world.won = true;
      world.lastEvent |= EVENT_JOB_DONE;
      return world.lastEvent;
    }
    loadJob(world, world.jobIndex + 1);
    world.lastEvent |= EVENT_JOB_DONE;
  }
  return world.lastEvent;
}

export function finalScore(world) {
  let score = world.totalLoot;
  for (const job of world.jobScores) score += job.timeBonus;
  return score;
}

export function isInVent(world) { return inVent(world, world.thief.x, world.thief.y); }
export { circleHitsWalls, GUARD };
