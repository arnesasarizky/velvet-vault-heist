// Shared constants for The Velvet Vault: sizes, speeds, alarm math and tool costs.
export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const BEST_KEY = 'velvet-vault-best';
export const THIEF = { radius: 14, walkSpeed: 170, sneakSpeed: 95, grabSeconds: 1.0 };
export const GUARD = { radius: 14, patrolSpeed: 70, chaseSpeed: 130, sightRange: 250, halfAngle: 0.61 };
export const CAMERA = { sightRange: 230, halfAngle: 0.5, sweepSpeed: 0.55 };
export const ALARM = { riseGuard: 55, riseCamera: 38, decay: 9, caughtAt: 100, suspicionAt: 55 };
export const TOOLS = {
  lockpick: { key: '1', name: 'Lockpick', cost: 0, charges: 2, blurb: 'Opens a locked case instantly' },
  smoke: { key: '2', name: 'Smoke bomb', cost: 250, charges: 2, blurb: 'Blinds guards + cameras for 4s' },
  emp: { key: '3', name: 'EMP pulse', cost: 400, charges: 1, blurb: 'Freezes every camera for 6s' },
};
export const JOB_NAMES = ['The Velvet Gallery', 'The Bank Vault', 'The Penthouse'];
export const COLORS = {
  floor: '#241d33', floorAlt: '#2a2140', wall: '#171224', wallTop: '#3a2f5c',
  shadow: '#191329', carpet: '#5c2a3a', gold: '#f2c14e', gem: '#7fe7d2',
  guard: '#e8e4da', guardAlert: '#ff5a4e', cone: 'rgba(242,193,78,0.20)',
  coneAlert: 'rgba(255,90,78,0.28)', camera: '#9fb4ff', thief: '#c9a7ff',
  exit: '#58d68d', vent: '#3d3550', hud: '#0e0b18',
};
