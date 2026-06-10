import * as THREE from 'three'

export interface TextTextureOptions {
  fill: string
  glow?: string
  font?: string
  width?: number
  height?: number
}

/** Renders glowing text to an offscreen canvas — used for signs and drum-head logos. */
export function makeTextTexture(text: string, opts: TextTextureOptions): THREE.CanvasTexture {
  const width = opts.width ?? 1024
  const height = opts.height ?? 256
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const g = canvas.getContext('2d')!
  g.clearRect(0, 0, width, height)
  g.font = opts.font ?? `900 ${Math.floor(height * 0.5)}px system-ui, sans-serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  if (opts.glow) {
    g.shadowColor = opts.glow
    g.shadowBlur = height * 0.22
  }
  g.fillStyle = opts.fill
  // Double-pass thickens the glow.
  g.fillText(text, width / 2, height / 2)
  g.fillText(text, width / 2, height / 2)
  const tex = new THREE.CanvasTexture(canvas)
  tex.anisotropy = 4
  return tex
}
