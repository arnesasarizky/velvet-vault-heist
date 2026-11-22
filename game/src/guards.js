// Guards: patrol a waypoint loop, pause at each stop, sweep their vision cone, and chase
// the thief while the alarm is hot. A guard only sees the thief inside the cone with a
// clear line of sight; sneaking in a vent halves the sight range.
import { GUARD } from './config.js';

export function createGuard(spot, index) {
  return {
    index, x: spot.x, y: spot.y, angle: 0, waypoint: 0, pause: 0,
    waypoints: spot.waypoints, pauseAtStop: spot.pause,
    state: 'patrol', alert: 0, seen: false, speed: GUARD.patrolSpeed,
  };
}

function angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Segment (ax,ay)-(bx,by) against rect r; true when the line is blocked.
export function lineBlocked(ax, ay, bx, by, walls) {
  for (const r of walls) {
    if (segmentHitsRect(ax, ay, bx, by, r)) return true;
  }
  return false;
}

function segmentHitsRect(ax, ay, bx, by, r) {
  const dx = bx - ax; const dy = by - ay;
  let tMin = 0; let tMax = 1;
  const checks = [
    [-dx, ax - r.x], [dx, r.x + r.w - ax], [-dy, ay - r.y], [dy, r.y + r.h - ay],
  ];
  for (const [p, q] of checks) {
    if (p === 0) { if (q < 0) return false; }
    else {
      const t = q / p;
      if (p < 0) { if (t > tMax) return false; if (t > tMin) tMin = t; }
      else { if (t < tMin) return false; if (t < tMax) tMax = t; }
    }
  }
  return true;
}

export function guardSeesThief(guard, thief, walls, inVent) {
  const dx = thief.x - guard.x; const dy = thief.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const range = GUARD.sightRange * (thief.sneaking || inVent ? 0.55 : 1);
  if (dist > range || dist < 1) return dist < 1;
  const toThief = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(toThief, guard.angle)) > GUARD.halfAngle) return false;
  return !lineBlocked(guard.x, guard.y, thief.x, thief.y, walls);
}

export function updateGuard(guard, dt, thief, walls, inVent, smokeLeft) {
  guard.seen = smokeLeft <= 0 && guardSeesThief(guard, thief, walls, inVent);
  if (guard.seen) guard.alert = Math.min(1, guard.alert + dt * 1.6);
  else guard.alert = Math.max(0, guard.alert - dt * 0.5);

  if (guard.alert > 0.6 && smokeLeft <= 0) {
    guard.state = 'chase';
    const target = angleTo(guard.x, guard.y, thief.x, thief.y);
    guard.angle = turnToward(guard.angle, target, dt * 4);
    const step = GUARD.chaseSpeed * dt;
    moveWithWalls(guard, Math.cos(guard.angle) * step, Math.sin(guard.angle) * step, walls);
    return;
  }
  guard.state = 'patrol';
  const target = guard.waypoints[guard.waypoint];
  if (guard.pause > 0) {
    guard.pause -= dt;
    guard.angle = turnToward(guard.angle, guard.angle + Math.sin(guard.pause * 2.2) * 0.02, dt);
    return;
  }
  const dx = target[0] - guard.x; const dy = target[1] - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 6) {
    guard.waypoint = (guard.waypoint + 1) % guard.waypoints.length;
    guard.pause = guard.pauseAtStop;
    return;
  }
  const heading = Math.atan2(dy, dx);
  guard.angle = turnToward(guard.angle, heading, dt * 5);
  const step = GUARD.patrolSpeed * dt;
  moveWithWalls(guard, Math.cos(guard.angle) * step, Math.sin(guard.angle) * step, walls);
}

export function turnToward(angle, target, maxStep) {
  const d = angleDiff(target, angle);
  if (Math.abs(d) <= maxStep) return target;
  return angle + Math.sign(d) * maxStep;
}

export function moveWithWalls(body, dx, dy, walls) {
  const nextX = body.x + dx;
  if (!circleHitsWalls(nextX, body.y, body.radius ?? 14, walls)) body.x = nextX;
  const nextY = body.y + dy;
  if (!circleHitsWalls(body.x, nextY, body.radius ?? 14, walls)) body.y = nextY;
}

export function circleHitsWalls(x, y, radius, walls) {
  if (x < 14 + radius || x > 1280 - 14 - radius || y < 98 + radius || y > 706 - radius) return true;
  for (const r of walls) {
    const cx = Math.max(r.x, Math.min(x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(y, r.y + r.h));
    if ((x - cx) ** 2 + (y - cy) ** 2 < radius * radius) return true;
  }
  return false;
}
