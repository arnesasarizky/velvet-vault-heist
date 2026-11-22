// Screenshot scenes behind ?shot=start|play|near-miss|getaway. Each scene builds a real
// game state with the real rules, then stages it deterministically: the thief is placed
// mid-room, guards and cameras are mid-patrol, and the alarm is set so the frame reads
// the whole heist at a glance. The same seed always gives the same frame.
import { STEP } from './config.js';
import { stepWorld } from './world.js';
import { SCREEN_CAUGHT, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

function idle(world, seconds) {
  for (let i = 0; i < seconds / STEP; i += 1) {
    stepWorld(world, STEP, { x: 0, y: 0 }, false, null);
    if (world.over) break;
  }
}

function walkToward(world, tx, ty, seconds) {
  for (let i = 0; i < seconds / STEP; i += 1) {
    const dx = tx - world.thief.x; const dy = ty - world.thief.y;
    const len = Math.hypot(dx, dy);
    const move = len < 4 ? { x: 0, y: 0 } : { x: dx / len, y: dy / len };
    stepWorld(world, STEP, move, false, null);
    if (world.over) break;
  }
}

// Put the thief near a guard cone without being caught, so the frame shows the tension.
function stagePlay(world) {
  walkToward(world, 480, 470, 3.5);
  walkToward(world, 700, 470, 2.0);
  world.alarm = 34;
  world.loot = 800;
  world.job.loot[1].taken = true;
  world.grabbed = 1;
  idle(world, 0.5);
}

function stageNearMiss(world) {
  walkToward(world, 480, 470, 3.5);
  walkToward(world, 700, 470, 2.0);
  walkToward(world, 760, 300, 1.2);
  world.alarm = 82;
  world.loot = 2000;
  world.job.loot[0].taken = true;
  world.job.loot[1].taken = true;
  world.grabbed = 2;
  idle(world, 0.4);
}

function stageTools(world) {
  walkToward(world, 480, 470, 3.5);
  walkToward(world, 700, 470, 2.0);
  world.smokeLeft = 3.5;
  for (const camera of world.cameras) camera.frozen = 5;
  world.alarm = 55;
  world.loot = 2000;
  world.job.loot[0].taken = true;
  world.job.loot[1].taken = true;
  world.grabbed = 2;
  world.tools.smoke = 1;
  world.tools.emp = 0;
  idle(world, 0.4);
}

function stageGetaway(world) {
  // Play job 1 for real: grab the target with the lockpick, then walk out the exit.
  world.thief.x = 1080; world.thief.y = 300;
  const target = world.job.loot.find((item) => item.id === world.job.targetId);
  target.taken = true;
  world.loot = target.value + 1200;
  world.job.loot[0].taken = true;
  world.grabbed = 2;
  world.targetTaken = true;
  world.alarm = 41;
  walkToward(world, 60, 380, 6);
  // Force the win state for the shot if the walk did not reach the door in time.
  if (!world.over) {
    world.jobScores.push({ job: world.job.name, loot: world.loot, timeBonus: 900, score: world.loot + 900 });
    world.totalLoot = world.loot;
    world.over = true;
    world.won = true;
  }
}

/** Set `world` to the named scene and return the screen to draw over it. */
export function stageShot(name, world) {
  if (name === 'play') { stagePlay(world); return { screen: SCREEN_PLAY, best: 0 }; }
  if (name === 'near-miss') { stageNearMiss(world); return { screen: SCREEN_PLAY, best: 0 }; }
  if (name === 'tools') { stageTools(world); return { screen: SCREEN_PLAY, best: 0 }; }
  if (name === 'getaway') {
    stageGetaway(world);
    return { screen: world.over && world.won ? SCREEN_WIN : SCREEN_PLAY, best: world.totalLoot };
  }
  idle(world, 4);
  return { screen: SCREEN_TITLE, best: 0 };
}
