// Loot: cases the thief grabs by holding E beside them. A locked case needs a lockpick
// (instant) or a slow 2.5 s crack. The target loot of each job must be taken before the
// getaway door opens.
import { THIEF } from './config.js';

export function nearestLoot(state, maxDist) {
  let best = null; let bestDist = maxDist;
  for (const item of state.job.loot) {
    if (item.taken) continue;
    const d = Math.hypot(item.x - state.thief.x, item.y - state.thief.y);
    if (d < bestDist) { best = item; bestDist = d; }
  }
  return best;
}

export function grabProgress(state, dt, holdingGrab) {
  const item = nearestLoot(state, 44);
  for (const other of state.job.loot) if (other !== item) other.grab = 0;
  if (!item) return null;
  if (!holdingGrab) { item.grab = 0; return item; }
  const rate = item.locked ? dt / 2.5 : dt / THIEF.grabSeconds;
  item.grab = Math.min(1, item.grab + rate);
  if (item.grab >= 1) {
    item.taken = true;
    state.loot += item.value;
    state.grabbed += 1;
    if (item.id === state.job.targetId) state.targetTaken = true;
    return item;
  }
  return item;
}

export function lootLeft(state) {
  return state.job.loot.filter((item) => !item.taken).length;
}

export function targetLoot(state) {
  return state.job.loot.find((item) => item.id === state.job.targetId);
}
