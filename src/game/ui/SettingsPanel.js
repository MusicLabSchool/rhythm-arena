export function createSettingsPanel(onClose, onDrumVolume) {
  const el = document.createElement('div');
  el.className = 'settings hidden';
  el.innerHTML = `
    <div class="settings-title">
      <b>Settings</b>
      <button id="close" aria-label="Close settings">×</button>
    </div>

    <label>
      Drum Volume
      <input id="drums" type="range" min="0" max="1" step="0.01" value="0.80" />
    </label>

    <div class="settings-row">Input: Keyboard / Touch / MIDI</div>
    <div class="settings-row">Keys: D Kick · F Snare · J Hi-hat · K Crash</div>
  `;

  el.querySelector('#close').addEventListener('click', onClose);
  el.querySelector('#drums').addEventListener('input', (e) => {
    onDrumVolume(Number(e.target.value));
  });

  return el;
}
