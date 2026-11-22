// Keyboard + mouse input: WASD/arrows to move, Shift to sneak, E to grab, 1/2/3 for tools,
// P or Esc to pause, click to drop a planning ping on the floor.
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_GRAB = 'grab';
export const ACTION_SNEAK = 'sneak';

const KEY_ACTIONS = {
  Enter: ACTION_CONFIRM, ' ': ACTION_CONFIRM,
  KeyE: ACTION_GRAB, KeyP: ACTION_PAUSE, Escape: ACTION_PAUSE,
  Digit1: 'tool1', Digit2: 'tool2', Digit3: 'tool3',
  ShiftLeft: ACTION_SNEAK, ShiftRight: ACTION_SNEAK,
};
const MOVE_KEYS = {
  KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0],
};

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let ping = null;
  let pingAge = 0;

  function onKeyDown(event) {
    if (MOVE_KEYS[event.code] || KEY_ACTIONS[event.code]) event.preventDefault();
    if (!event.repeat) pressed.add(KEY_ACTIONS[event.code] ?? event.code);
    held.add(event.code);
  }
  function onKeyUp(event) { held.delete(event.code); }
  function onClick(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    ping = { x: (event.clientX - rect.left) * scaleX, y: (event.clientY - rect.top) * scaleY };
    pingAge = 0;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onClick);

  return {
    moveVector() {
      let x = 0; let y = 0;
      for (const code of held) {
        const dir = MOVE_KEYS[code];
        if (dir) { x += dir[0]; y += dir[1]; }
      }
      if (x === 0 && y === 0) return { x: 0, y: 0 };
      const len = Math.hypot(x, y);
      return { x: x / len, y: y / len };
    },
    sneaking() { return held.has('ShiftLeft') || held.has('ShiftRight'); },
    grabHeld() { return held.has('KeyE'); },
    consume(action) {
      if (pressed.has(action)) { pressed.delete(action); return true; }
      return false;
    },
    ping() { return ping; },
    clearPing() { ping = null; },
    tick(dt) { if (ping) { pingAge += dt; if (pingAge > 6) ping = null; } },
  };
}
