import { getGameLayoutConfig } from './layout/gameLayout.js';
import { drawHighway } from './highway/RhythmHighway.js';
import { drawHitLine } from './highway/HitLine.js';
import { drawNote } from './highway/NoteMesh.js';

export class GameCanvas {
  constructor(root, runtime, limbAnimator) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.runtime = runtime;
    this.limbAnimator = limbAnimator;

    root.appendChild(this.canvas);
    this.resize();
    addEventListener('resize', () => this.resize());
    requestAnimationFrame(() => this.draw());
  }

  resize() {
    this.w = innerWidth;
    this.h = innerHeight;
    this.canvas.width = this.w * devicePixelRatio;
    this.canvas.height = this.h * devicePixelRatio;
    this.ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  drawDrums(layout) {
    const c = this.ctx;
    c.fillStyle = '#2a1a12';
    c.fillRect(0, this.h * layout.drumVisibleStartY, this.w, this.h * (1 - layout.drumVisibleStartY));

    c.fillStyle = '#ddd';
    [[0.36, 0.8, 74], [0.5, 0.82, 94], [0.64, 0.8, 74]].forEach(([x, y, r]) => {
      c.beginPath();
      c.arc(this.w * x, this.h * y, r, 0, Math.PI * 2);
      c.fill();
    });

    // pedals and feet
    c.fillStyle = '#666';
    c.fillRect(this.w * 0.34, this.h * 0.93, 66, 12);
    c.fillRect(this.w * 0.54, this.h * 0.92, 66, 12);

    const pose = this.limbAnimator.getPose();
    c.fillStyle = '#111';
    c.fillRect(this.w * pose.leftFoot.x, this.h * pose.leftFoot.y, 58, 24);
    c.fillRect(this.w * pose.rightFoot.x, this.h * pose.rightFoot.y, 58, 24);
  }

  draw() {
    const c = this.ctx;
    const isMobile = this.w < 900;
    const layout = getGameLayoutConfig(isMobile);

    c.clearRect(0, 0, this.w, this.h);
    const laneTop = this.h * layout.laneStartY;
    const laneBottom = this.h * layout.laneEndY;

    drawHighway(c, this.w, laneTop, laneBottom, layout.laneOpacity);
    drawHitLine(c, this.w, this.h * layout.hitLineY);

    const now = performance.now() - this.runtime.t0;
    for (const n of this.runtime.notes) {
      if (n.judged) continue;
      const p = 1 - (n.targetTimeMs - now) / 2000;
      if (p < 0 || p > 1.1) continue;
      const y = laneTop + (laneBottom - laneTop) * p;
      const lane = { kick: 0, snare: 1, hihat: 2, crash: 3 }[n.type];
      const x = this.w * (0.22 + lane * 0.18);
      drawNote(c, x, y, lane);
    }

    this.drawDrums(layout);
    this.runtime.tick();
    requestAnimationFrame(() => this.draw());
  }
}
