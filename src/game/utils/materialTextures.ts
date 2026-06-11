import * as THREE from 'three'

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.min(255, Math.max(0, (n >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (n & 0xff) + amount))
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Vertical wood-grain veneer wrapped around a drum shell.
 * CylinderGeometry's U axis wraps the circumference, so vertical streaks
 * here become the grain lines running around the shell.
 */
export function makeWoodShellTexture(baseColor: string): THREE.CanvasTexture {
  const w = 512
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, w, h)

  // Grain streaks running the height of the shell
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * w
    const tone = (Math.random() - 0.5) * 24
    ctx.strokeStyle = shade(baseColor, tone)
    ctx.globalAlpha = 0.15 + Math.random() * 0.2
    ctx.lineWidth = 0.6 + Math.random() * 2.2
    ctx.beginPath()
    ctx.moveTo(x, 0)
    let cx = x
    for (let y = 0; y <= h; y += 16) {
      cx += (Math.random() - 0.5) * 6
      ctx.lineTo(cx, y)
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // Soft vertical lacquer highlight band
  const grad = ctx.createLinearGradient(0, 0, w, 0)
  grad.addColorStop(0, 'rgba(255,255,255,0)')
  grad.addColorStop(0.42, 'rgba(255,255,255,0.05)')
  grad.addColorStop(0.5, 'rgba(255,255,255,0.16)')
  grad.addColorStop(0.58, 'rgba(255,255,255,0.05)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/**
 * Brushed-metal texture: fine vertical streaks running the shell's length.
 */
export function makeBrushedMetalTexture(baseColor: string): THREE.CanvasTexture {
  const w = 256
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, w, h)

  for (let i = 0; i < 600; i++) {
    const x = Math.random() * w
    const tone = (Math.random() - 0.5) * 26
    ctx.strokeStyle = shade(baseColor, tone)
    ctx.globalAlpha = 0.08 + Math.random() * 0.12
    ctx.lineWidth = 0.5 + Math.random()
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + (Math.random() - 0.5) * 4, h)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(2, 1)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/**
 * Concentric lathe-groove rings for a cymbal. ConeGeometry's V axis runs from
 * tip (bell) to base (edge), so horizontal bands here become rings when
 * wrapped around the circumference (U axis).
 */
export function makeCymbalTexture(baseColor: string): THREE.CanvasTexture {
  const w = 64
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  for (let y = 0; y < h; y++) {
    const v = y / h
    const groove = Math.sin(v * 70) * 10 + Math.sin(v * 23) * 6
    const bellGlow = (1 - v) * 18 // brighter near the bell
    const noise = (Math.random() - 0.5) * 6
    ctx.fillStyle = shade(baseColor, groove + bellGlow + noise)
    ctx.fillRect(0, y, w, 1)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}
