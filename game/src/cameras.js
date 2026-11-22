// Security cameras: fixed to the wall, sweeping a cone back and forth. An EMP freezes
// them; smoke hides the thief from them. Cameras never chase — they only raise the alarm.
import { CAMERA } from './config.js';
import { lineBlocked } from './guards.js';

export function createCamera(spot, index) {
  return {
    index, x: spot.x, y: spot.y, baseAngle: spot.baseAngle, sweep: spot.sweep,
    angle: spot.baseAngle, phase: index * 1.7, frozen: 0, seen: false,
  };
}

export function updateCamera(camera, dt, time) {
  if (camera.frozen > 0) { camera.frozen -= dt; return; }
  camera.angle = camera.baseAngle + Math.sin(time * CAMERA.sweepSpeed + camera.phase) * camera.sweep;
}

export function cameraSeesThief(camera, thief, walls, inVent) {
  if (camera.frozen > 0) return false;
  const dx = thief.x - camera.x; const dy = thief.y - camera.y;
  const dist = Math.hypot(dx, dy);
  const range = CAMERA.sightRange * (inVent ? 0.5 : 1);
  if (dist > range || dist < 1) return false;
  let d = Math.atan2(dy, dx) - camera.angle;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  if (Math.abs(d) > CAMERA.halfAngle) return false;
  return !lineBlocked(camera.x, camera.y, thief.x, thief.y, walls);
}
