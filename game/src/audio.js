// Sound, all synthesized with WebAudio oscillators — no audio files, no network.
// A soft low pulse while hidden, a rising tick as the alarm climbs, a chime for loot.
export function createAudio() {
  let context = null;
  let master = null;
  let muted = false;
  let lastTick = 0;

  function ensure() {
    if (context) return true;
    try {
      const AC = window.AudioContext ?? window.webkitAudioContext;
      if (!AC) return false;
      context = new AC();
      master = context.createGain();
      master.gain.value = 0.12;
      master.connect(context.destination);
      return true;
    } catch { return false; }
  }

  function tone(freq, seconds, type, when, slideTo) {
    if (!ensure() || muted) return;
    const now = context.currentTime + (when ?? 0);
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type ?? 'sine';
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + seconds);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(1, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    osc.connect(gain); gain.connect(master);
    osc.start(now); osc.stop(now + seconds + 0.05);
  }

  return {
    unlock() { ensure(); if (context && context.state === 'suspended') context.resume(); },
    toggleMute() { muted = !muted; return muted; },
    coin() { tone(880, 0.18, 'sine'); tone(1318, 0.25, 'sine', 0.07); },
    vault() { tone(523, 0.3, 'triangle'); tone(784, 0.3, 'triangle', 0.1); tone(1046, 0.45, 'triangle', 0.2); },
    alarmTick(alarm) {
      const now = performance.now();
      const interval = alarm > 70 ? 220 : alarm > 40 ? 420 : 800;
      if (now - lastTick < interval) return;
      lastTick = now;
      tone(alarm > 70 ? 980 : 660, 0.09, 'square');
    },
    caught() { tone(220, 0.5, 'sawtooth', 0, 110); tone(110, 0.7, 'sawtooth', 0.15, 55); },
    win() {
      tone(523, 0.2, 'triangle'); tone(659, 0.2, 'triangle', 0.12);
      tone(784, 0.2, 'triangle', 0.24); tone(1046, 0.5, 'triangle', 0.36);
    },
    smoke() { tone(300, 0.4, 'sine', 0, 90); },
    emp() { tone(1200, 0.35, 'square', 0, 200); },
  };
}
