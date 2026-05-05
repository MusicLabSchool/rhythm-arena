export function drawHitLine(ctx, w, y) {
  ctx.strokeStyle = 'rgba(255,194,127,0.95)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.18, y);
  ctx.lineTo(w * 0.82, y);
  ctx.stroke();
}
