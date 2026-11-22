// The renderer: draws the floor plan, vision cones, guards, cameras, loot, the thief and
// the HUD on one canvas. Safe cover is dark carpet and vents, danger is amber/red cones,
// loot glows gold — readable at a glance, even shrunk to a contact sheet.
import { ALARM, CAMERA, COLORS, GUARD, TOOLS, VIEW } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_WIN = 'win';

function conePath(ctx, x, y, angle, range, halfAngle) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, range, halfAngle, alert) {
  ctx.fillStyle = alert ? COLORS.coneAlert : COLORS.cone;
  conePath(ctx, x, y, angle, range, halfAngle);
  ctx.fill();
  ctx.strokeStyle = alert ? 'rgba(255,90,78,0.55)' : 'rgba(242,193,78,0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawLootShape(ctx, item) {
  const pulse = 0.75 + Math.sin(performance.now() / 280 + item.x) * 0.25;
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.globalAlpha = item.taken ? 0.25 : 1;
  ctx.shadowColor = COLORS.gold;
  ctx.shadowBlur = 14 * pulse;
  if (item.kind === 'painting' || item.kind === 'deed' || item.kind === 'ledger') {
    ctx.fillStyle = item.kind === 'painting' ? '#7a4a2b' : '#e8dcc0';
    ctx.fillRect(-16, -12, 32, 24);
    ctx.strokeStyle = COLORS.gold; ctx.lineWidth = 3; ctx.strokeRect(-16, -12, 32, 24);
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
  } else if (item.kind === 'diamond' || item.kind === 'ruby' || item.kind === 'heart') {
    ctx.fillStyle = item.kind === 'ruby' ? '#ff4d6d' : item.kind === 'heart' ? '#ff7fb0' : COLORS.gem;
    ctx.beginPath();
    ctx.moveTo(0, -14); ctx.lineTo(12, 0); ctx.lineTo(0, 14); ctx.lineTo(-12, 0); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
  } else if (item.kind === 'vault' || item.kind === 'bars') {
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(-14, -10, 28, 20);
    ctx.fillStyle = '#8a6a1f';
    ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff2c0'; ctx.fillRect(-10, -6, 6, 4); ctx.fillRect(2, -6, 6, 4);
  } else {
    ctx.fillStyle = '#c9a7ff';
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -3, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  if (item.locked && !item.taken) {
    ctx.fillStyle = '#ff8a5c';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔒', item.x, item.y - 24);
  }
  if (item.grab > 0 && item.grab < 1) {
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(item.x, item.y, 22, -Math.PI / 2, -Math.PI / 2 + item.grab * Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(item.label, item.x, item.y + 34);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(item.taken ? 'TAKEN' : `$${item.value.toLocaleString('en-US')}`, item.x, item.y + 49);
}

function drawGuard(ctx, guard) {
  drawCone(ctx, guard.x, guard.y, guard.angle, GUARD.sightRange, GUARD.halfAngle, guard.alert > 0.6);
  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.rotate(guard.angle);
  ctx.fillStyle = guard.alert > 0.6 ? COLORS.guardAlert : COLORS.guard;
  ctx.beginPath(); ctx.arc(0, 0, GUARD.radius, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1b1430';
  ctx.beginPath(); ctx.arc(5, -5, 3, 0, Math.PI * 2); ctx.arc(5, 5, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = guard.alert > 0.6 ? '#ff5a4e' : '#2b6cb0';
  ctx.fillRect(4, -8, 12, 16);
  ctx.restore();
  if (guard.alert > 0.25) {
    ctx.fillStyle = guard.alert > 0.6 ? '#ff5a4e' : '#f2c14e';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(guard.alert > 0.6 ? '!' : '?', guard.x, guard.y - 22);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(guard.state === 'chase' ? 'GUARD — CHASING' : 'GUARD', guard.x, guard.y + 28);
}

function drawCamera(ctx, camera) {
  if (camera.frozen <= 0) drawCone(ctx, camera.x, camera.y, camera.angle, CAMERA.sightRange, CAMERA.halfAngle, camera.seen);
  ctx.save();
  ctx.translate(camera.x, camera.y);
  ctx.rotate(camera.angle);
  ctx.fillStyle = camera.frozen > 0 ? '#555' : COLORS.camera;
  ctx.fillRect(-8, -6, 16, 12);
  ctx.beginPath(); ctx.arc(10, 0, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = camera.frozen > 0 ? '#888' : (camera.seen ? '#ff5a4e' : 'rgba(255,255,255,0.75)');
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(camera.frozen > 0 ? 'CAMERA — OFFLINE' : 'CAMERA', camera.x, camera.y + 26);
}

function drawThief(ctx, thief, smokeLeft) {
  ctx.save();
  ctx.translate(thief.x, thief.y);
  ctx.shadowColor = COLORS.thief;
  ctx.shadowBlur = 12;
  ctx.fillStyle = COLORS.thief;
  ctx.beginPath(); ctx.arc(0, 0, thief.radius, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#1b1430';
  ctx.beginPath(); ctx.arc(4, -5, 3, 0, Math.PI * 2); ctx.arc(4, 5, 3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#1b1430'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(thief.facing) * 18, Math.sin(thief.facing) * 18); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(thief.sneaking ? 'YOU — SNEAKING' : 'YOU', thief.x, thief.y - 22);
  if (smokeLeft > 0) {
    ctx.fillStyle = 'rgba(200,200,220,0.35)';
    ctx.beginPath(); ctx.arc(thief.x, thief.y, 70, 0, Math.PI * 2); ctx.fill();
  }
}

function drawHud(ctx, world, best) {
  const job = world.job;
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, 0, VIEW.width, 84);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('THE VELVET VAULT', 20, 30);
  ctx.font = '15px sans-serif';
  ctx.fillStyle = '#c9b8e8';
  ctx.fillText(`Job ${world.jobIndex + 1}/3 — ${job.name}`, 20, 56);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`💰 $${world.loot.toLocaleString('en-US')}`, 420, 32);
  ctx.fillStyle = '#c9b8e8';
  ctx.font = '14px sans-serif';
  ctx.fillText(world.targetTaken ? 'Target secured — reach the green EXIT' : 'Objective: grab the target loot, then escape', 420, 58);

  // Alarm meter.
  const ax = 830; const ay = 16; const aw = 300; const ah = 22;
  ctx.fillStyle = '#2a2140';
  ctx.fillRect(ax, ay, aw, ah);
  const frac = world.alarm / 100;
  ctx.fillStyle = world.alarm > ALARM.suspicionAt ? '#ff5a4e' : world.alarm > 25 ? '#f2c14e' : '#58d68d';
  ctx.fillRect(ax, ay, aw * frac, ah);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(ax, ay, aw, ah);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`ALARM ${Math.round(world.alarm)}%${world.alarm > ALARM.suspicionAt ? ' — SPOTTED!' : ''}`, ax, ay + 40);
  ctx.fillStyle = '#c9b8e8';
  ctx.font = '13px sans-serif';
  ctx.fillText(`⏱ ${Math.floor(world.jobTime / 60)}:${String(Math.floor(world.jobTime % 60)).padStart(2, '0')}  •  Best $${best.toLocaleString('en-US')}`, ax, ay + 60);

  // Tools strip.
  const tools = [
    ['1', 'Pick', world.tools.lockpick, 'FREE'],
    ['2', 'Smoke', world.tools.smoke, '$250'],
    ['3', 'EMP', world.tools.emp, '$400'],
  ];
  let tx = 1142;
  ctx.font = '11px sans-serif';
  for (const [key, name, count, cost] of tools) {
    ctx.fillStyle = count > 0 ? '#3a2f5c' : '#241d33';
    ctx.fillRect(tx - 4, 10, 42, 64);
    ctx.fillStyle = '#fff';
    ctx.fillText(`[${key}]`, tx, 26);
    ctx.fillText(name, tx, 42);
    ctx.fillStyle = count > 0 ? COLORS.gold : '#777';
    ctx.fillText(`x${count} ${cost}`, tx, 58);
    tx += 46;
  }
  ctx.fillStyle = '#c9b8e8';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('WASD move • Shift sneak • E grab • 1/2/3 tools • click to ping a route', 20, 78);
}

function drawRoom(ctx, world) {
  const job = world.job;
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 84, VIEW.width, VIEW.height - 84);
  ctx.fillStyle = COLORS.floorAlt;
  for (let y = 84; y < VIEW.height; y += 56) {
    for (let x = (y / 56) % 2 === 0 ? 0 : 28; x < VIEW.width; x += 56) {
      ctx.fillRect(x, y, 26, 26);
    }
  }
  // Carpet runner down the middle: the risky fast route.
  ctx.fillStyle = COLORS.carpet;
  ctx.fillRect(0, 330, VIEW.width, 90);
  ctx.fillStyle = 'rgba(242,193,78,0.25)';
  ctx.fillRect(0, 330, VIEW.width, 4);
  ctx.fillRect(0, 416, VIEW.width, 4);
  // Vents: dark crawlspaces where cones barely reach.
  for (const v of job.vents) {
    ctx.fillStyle = COLORS.vent;
    ctx.fillRect(v.x, v.y, v.w, v.h);
    ctx.fillStyle = '#8f86ad';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('VENT — hidden route', v.x + 8, v.y + 16);
  }
  // Exit / getaway door.
  const exit = job.exit;
  ctx.fillStyle = world.targetTaken ? COLORS.exit : '#3a5a44';
  ctx.fillRect(exit.x - 6, exit.y - 6, exit.w + 12, exit.h + 12);
  ctx.fillStyle = '#0c0a14';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', exit.x + exit.w / 2, exit.y + exit.h / 2 + 5);
  ctx.fillStyle = world.targetTaken ? COLORS.exit : '#9fb4a8';
  ctx.font = '11px sans-serif';
  ctx.fillText(world.targetTaken ? 'GETAWAY OPEN — GO!' : 'LOCKED until target loot is taken', 120, exit.y + exit.h / 2 + 5);
  // Walls.
  for (const w of job.walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 4);
  }
  for (const item of job.loot) drawLootShape(ctx, item);
  for (const camera of world.cameras) drawCamera(ctx, camera);
  for (const guard of world.guards) drawGuard(ctx, guard);
  drawThief(ctx, world.thief, world.smokeLeft);
}

function overlay(ctx, lines, accent) {
  ctx.fillStyle = 'rgba(10,8,18,0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  let y = 200;
  for (const [text, size, color] of lines) {
    ctx.fillStyle = color ?? '#fff';
    ctx.font = `${size}px sans-serif`;
    ctx.fillText(text, VIEW.width / 2, y);
    y += size + 18;
  }
  if (accent) {
    ctx.fillStyle = COLORS.gold;
    ctx.font = '16px sans-serif';
    ctx.fillText(accent, VIEW.width / 2, y + 10);
  }
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  function fit() {
    const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
    canvas.width = VIEW.width;
    canvas.height = VIEW.height;
    canvas.style.width = `${Math.floor(VIEW.width * scale)}px`;
    canvas.style.height = `${Math.floor(VIEW.height * scale)}px`;
  }
  fit();
  window.addEventListener('resize', fit);

  return {
    draw(state, screen, best, extra) {
      ctx.clearRect(0, 0, VIEW.width, VIEW.height);
      if (screen === SCREEN_TITLE) {
        drawRoom(ctx, state);
        drawHud(ctx, state, best);
        overlay(ctx, [
          ['THE VELVET VAULT', 54, COLORS.gold],
          ['Three jobs. One crew. No alarms.', 24, '#e8e4da'],
          ['Sneak past guards and cameras, grab the target loot,', 20, '#c9b8e8'],
          ['then reach the green EXIT before the alarm hits 100%.', 20, '#c9b8e8'],
          ['WASD / arrows move  •  Shift sneak  •  E grab  •  1 lockpick  2 smoke  3 EMP', 18, '#fff'],
        ], 'Press Enter or click to start the first job');
        return;
      }
      drawRoom(ctx, state);
      drawHud(ctx, state, best);
      if (state.ping) {
        ctx.strokeStyle = '#7fe7d2';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(state.ping.x, state.ping.y, 12, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(state.ping.x - 16, state.ping.y); ctx.lineTo(state.ping.x + 16, state.ping.y); ctx.stroke();
      }
      if (screen === SCREEN_PAUSED) {
        overlay(ctx, [['PAUSED', 48, '#fff'], ['The crew waits in the dark.', 20, '#c9b8e8']], 'Press P to keep going');
      } else if (screen === SCREEN_CAUGHT) {
        overlay(ctx, [
          ['CAUGHT!', 56, '#ff5a4e'],
          [`${state.spottedBy ?? 'A guard'} spotted you — alarm hit 100%.`, 22, '#fff'],
          [`Loot kept: $${state.totalLoot.toLocaleString('en-US')}  •  This job: $${state.loot.toLocaleString('en-US')}`, 20, '#c9b8e8'],
          ['Watch the cones. Vents and smoke break line of sight.', 18, '#c9b8e8'],
        ], 'Press Enter to try the job again');
      } else if (screen === SCREEN_WIN) {
        const lines = [['GETAWAY!', 56, COLORS.exit], ['The crew vanishes into the night.', 22, '#fff']];
        for (const job of state.jobScores) {
          lines.push([`${job.job}: loot $${job.loot.toLocaleString('en-US')} + time bonus $${job.timeBonus.toLocaleString('en-US')}`, 19, '#e8e4da']);
        }
        const total = state.jobScores.reduce((sum, job) => sum + job.score, 0);
        lines.push([`TOTAL SCORE $${total.toLocaleString('en-US')}`, 26, COLORS.gold]);
        overlay(ctx, lines, 'Press Enter to run it back');
      }
      if (extra && extra.banner) {
        ctx.fillStyle = 'rgba(10,8,18,0.85)';
        ctx.fillRect(VIEW.width / 2 - 320, 96, 640, 44);
        ctx.fillStyle = COLORS.gold;
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(extra.banner, VIEW.width / 2, 125);
      }
    },
  };
}
