export function drawHighway(ctx, w, top, bottom, opacity) {
  ctx.fillStyle = `rgba(5,8,18,${opacity})`;
  ctx.beginPath();
  ctx.moveTo(w * 0.3, top);
  ctx.lineTo(w * 0.7, top);
  ctx.lineTo(w * 0.82, bottom);
  ctx.lineTo(w * 0.18, bottom);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(w * (0.3 + 0.1 * i), top);
    ctx.lineTo(w * (0.18 + 0.16 * i), bottom);
    ctx.stroke();
  }
}
