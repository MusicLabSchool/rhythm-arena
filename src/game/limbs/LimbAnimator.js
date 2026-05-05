import { limbRestPose } from './limbMaps.js';

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function getStrikeProgress(elapsedMs, durationMs) {
  const t = Math.min(elapsedMs / durationMs, 1);
  if (t < 0.45) return easeOutCubic(t / 0.45);
  return 1 - easeOutCubic((t - 0.45) / 0.55);
}

export class LimbAnimator {
  constructor() {
    this.active = {
      leftHand: null,
      rightHand: null,
      leftFoot: null,
      rightFoot: null,
    };
  }

  trigger(limb, target, velocity = 1) {
    this.active[limb] = {
      target,
      startTime: performance.now(),
      durationMs: limb.includes('Foot') ? 130 : 160,
      velocity,
    };
  }

  getPose(now = performance.now()) {
    const pose = structuredClone(limbRestPose);

    for (const [limb, action] of Object.entries(this.active)) {
      if (!action) continue;
      const elapsed = now - action.startTime;
      if (elapsed > action.durationMs) {
        this.active[limb] = null;
        continue;
      }

      const strike = getStrikeProgress(elapsed, action.durationMs);
      const amp = 0.035 * action.velocity;
      pose[limb].y += amp * (1 - strike);
    }

    return pose;
  }
}
