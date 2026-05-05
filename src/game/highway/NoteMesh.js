import { laneTargets } from '../kit/DrumTargets.js';

export function drawNote(ctx, x, y, laneIndex) {
  const color = laneTargets[laneIndex]?.color || '#fff';
  ctx.fillStyle = color;
  ctx.shadowBlur = 14;
  ctx.shadowColor = color;
  ctx.beginPath();
  ctx.roundRect(x - 16, y - 10, 32, 20, 8);
  ctx.fill();
  ctx.shadowBlur = 0;
}
