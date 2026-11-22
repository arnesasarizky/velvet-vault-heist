// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps, and the renderer paints what is there. Screens: title, play, paused, caught, win.
// ?seed=N fixes the job layout. ?shot=start|play|near-miss|getaway (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets window.__shotReady.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, resetRun, stepWorld, useTool, EVENT_CAUGHT, EVENT_JOB_DONE } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_CAUGHT, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();
// Test handle so automated play-tests can read live state (not used by the game itself).
window.__velvetWorld = world;

function readBest() {
  try { return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; }
  catch { return 0; }
}
function saveBest(value) {
  try { window.localStorage.setItem(BEST_KEY, String(value)); } catch { /* storage can be off */ }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world, scene.screen, scene.best, scene.banner ? { banner: scene.banner } : null);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) { status.textContent = message; }

  function startGame() {
    resetRun(world);
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    announce(`Playing job 1, ${world.job.name}. Grab the target loot and reach the exit.`);
  }

  function endRun() {
    const total = world.jobScores.reduce((sum, job) => sum + job.score, 0);
    if (total > best) { best = total; saveBest(best); }
    announce(world.won ? `Getaway! Total score ${total}.` : `Caught. Score ${total}.`);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    input.tick(dt);
    world.ping = input.ping();

    if (input.consume(ACTION_PAUSE) && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (input.consume(ACTION_PAUSE) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
    }

    if (screen === SCREEN_TITLE || screen === SCREEN_CAUGHT || screen === SCREEN_WIN) {
      if (input.consume(ACTION_CONFIRM)) {
        audio.unlock();
        startGame();
      }
    } else if (screen === SCREEN_PLAY) {
      if (input.consume('tool1')) useTool(world, 'lockpick', audio);
      if (input.consume('tool2')) useTool(world, 'smoke', audio);
      if (input.consume('tool3')) useTool(world, 'emp', audio);
      world.thief.sneaking = input.sneaking();
      const grab = input.grabHeld();
      accumulator += dt;
      while (accumulator >= STEP) {
        accumulator -= STEP;
        const events = stepWorld(world, STEP, input.moveVector(), grab, audio);
        if (events & EVENT_CAUGHT) { screen = SCREEN_CAUGHT; endRun(); }
        else if ((events & EVENT_JOB_DONE) && world.over && world.won) { screen = SCREEN_WIN; endRun(); }
        else if (events & EVENT_JOB_DONE) {
          announce(`Job done — now ${world.job.name}.`);
        }
      }
    }
    renderer.draw(world, screen, best, null);
  }
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
