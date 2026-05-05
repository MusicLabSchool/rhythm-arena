import { audioEngine } from '../audio/NativeAudioEngine.js';
import { judgeDelta, pointsFor } from './TimingJudge.js';

export class GameRuntime {
  constructor() {
    this.running = false;
    this.notes = [];
    this.score = 0;
    this.combo = 0;
    this.hits = 0;
    this.accurate = 0;
    this.latencyOffsetMs = 0;
  }

  start(notes) {
    this.notes = notes.map((n) => ({ ...n, judged: false }));
    this.running = true;
    this.t0 = performance.now();
    this.score = 0;
    this.combo = 0;
    this.hits = 0;
    this.accurate = 0;
    this.emit('ready');
  }

  hit(type, velocity = 1, playAudio = true) {
    if (playAudio) audioEngine.playDrum(type, velocity);
    if (!this.running) return;

    const now = performance.now() - this.t0 + this.latencyOffsetMs;
    const candidate = this.notes
      .filter((n) => !n.judged && n.type === type)
      .map((n) => ({ n, d: now - n.targetTimeMs }))
      .filter((x) => Math.abs(x.d) < 180)
      .sort((a, b) => Math.abs(a.d) - Math.abs(b.d))[0];

    if (!candidate) {
      this.combo = 0;
      this.emit('miss');
      return;
    }

    candidate.n.judged = true;
    const rating = judgeDelta(candidate.d);
    this.score += pointsFor(rating) * velocity;
    this.combo = rating === 'miss' ? 0 : this.combo + 1;
    this.hits += 1;

    if (rating === 'perfect' || rating === 'great') this.accurate += 1;
    this.emit(rating);
  }

  tick() {
    if (!this.running) return;
    const now = performance.now() - this.t0;

    for (const n of this.notes) {
      if (!n.judged && now - n.targetTimeMs > 180) {
        n.judged = true;
        this.combo = 0;
        this.hits += 1;
        this.emit('miss');
      }
    }
  }

  emit(lastRating) {
    this.onSnapshot?.({
      score: Math.round(this.score),
      combo: this.combo,
      accuracy: this.hits ? Math.round((this.accurate / this.hits) * 100) : 100,
      lastRating,
    });
  }
}
