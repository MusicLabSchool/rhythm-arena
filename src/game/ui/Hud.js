export function createHud(onPlay, onSettings) {
  const el = document.createElement('div');
  el.className = 'hud';
  el.innerHTML = `
    <div id="s">Score 0</div>
    <div id="c">Combo 0</div>
    <div id="a">Acc 100%</div>
    <div id="b">92 BPM</div>
    <div id="r">Ready</div>
    <button id="sett" aria-label="Open settings">Settings</button>
    <button id="play" aria-label="Start lesson">Play</button>
  `;

  el.querySelector('#play').addEventListener('click', onPlay);
  el.querySelector('#sett').addEventListener('click', onSettings);

  return el;
}
