import { GameRuntime } from './core/GameRuntime.js';
import { lessons } from './data/lessons.js';
import { createHud } from './ui/Hud.js';
import { createTouchControls } from './ui/TouchControls.js';
import { createSettingsPanel } from './ui/SettingsPanel.js';
import { createDebugPanel } from './ui/DebugPanel.js';
import { GameCanvas } from './GameCanvas.js';
import { audioEngine } from './audio/NativeAudioEngine.js';
import { attachAudioUnlock } from './audio/unlockAudio.js';
import { MidiManager } from './midi/MidiManager.js';
import { LimbAnimator } from './limbs/LimbAnimator.js';
import { limbTargetMap } from './limbs/limbMaps.js';

export function GamePage() {
  const root = document.createElement('div');
  root.className = 'game-root';

  const runtime = new GameRuntime();
  const limbAnimator = new LimbAnimator();

  const triggerHit = (type, velocity = 1) => {
    runtime.hit(type, velocity, true);
    const limbs = limbTargetMap[type] || [];
    for (const limb of limbs) limbAnimator.trigger(limb, type, velocity);
  };

  const hud = createHud(play, () => settings.classList.toggle('hidden'));
  const touch = createTouchControls(triggerHit);
  const settings = createSettingsPanel(
    () => settings.classList.add('hidden'),
    (volume) => audioEngine.setDrumVolume(volume),
  );
  const debug = createDebugPanel();

  root.append(hud, settings, touch, debug);
  new GameCanvas(root, runtime, limbAnimator);

  runtime.onSnapshot = (s) => {
    hud.querySelector('#s').textContent = `Score ${s.score}`;
    hud.querySelector('#c').textContent = `Combo ${s.combo}`;
    hud.querySelector('#a').textContent = `Acc ${s.accuracy}%`;
    hud.querySelector('#r').textContent = s.lastRating;
  };

  attachAudioUnlock();

  const midi = new MidiManager();
  midi.init()
    .then(() => { midi.onHit = triggerHit; })
    .catch(() => {});

  function play() {
    audioEngine.unlock();
    const lesson = lessons[0];
    hud.querySelector('#b').textContent = `${lesson.bpm} BPM`;

    const beatMs = 60000 / lesson.bpm;
    const notes = [];

    for (let bar = 0; bar < 8; bar++) {
      for (const n of lesson.notes) {
        notes.push({
          id: crypto.randomUUID(),
          type: n.type,
          targetTimeMs: 1500 + bar * 4 * beatMs + (n.beat - 1) * beatMs,
        });
      }
    }

    runtime.start(notes);
  }

  function debugLoop() {
    const s = audioEngine.getState();
    debug.textContent = `FPS~60 | Audio:${s.state} | Lat:${Math.round((s.baseLatency || 0) * 1000)}ms | Notes:${runtime.notes.length}`;
    requestAnimationFrame(debugLoop);
  }
  debugLoop();

  addEventListener('keydown', (e) => {
    const map = { d: 'kick', f: 'snare', j: 'hihat', k: 'crash' };
    const type = map[e.key.toLowerCase()];
    if (type) triggerHit(type, 1);
  });

  return root;
}
