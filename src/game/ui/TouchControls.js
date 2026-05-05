const buttons = [
  { id: 'kick', label: 'KICK' },
  { id: 'snare', label: 'SNARE' },
  { id: 'hihat', label: 'HI-HAT' },
  { id: 'crash', label: 'CRASH' },
];

export function createTouchControls(onHit) {
  const el = document.createElement('div');
  el.className = 'touch';

  for (const btn of buttons) {
    const button = document.createElement('button');
    button.textContent = btn.label;
    button.dataset.hit = btn.id;
    button.addEventListener('pointerdown', () => onHit(btn.id, 1));
    el.appendChild(button);
  }

  return el;
}
