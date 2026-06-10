import * as THREE from 'three'

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.min(255, Math.max(0, (n >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (n & 0xff) + amount))
  return `rgb(${r}, ${g}, ${b})`
}

/** Procedural wood-plank texture (base color + grain) for the studio floor. */
export function makeWoodFloorTexture(baseColor = '#4a2f1a'): THREE.CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, size, size)

  const plankCount = 8
  const plankHeight = size / plankCount
  for (let i = 0; i < plankCount; i++) {
    const tone = (Math.random() - 0.5) * 18
    ctx.fillStyle = shade(baseColor, tone)
    ctx.fillRect(0, i * plankHeight, size, plankHeight)

    // Wood grain streaks running along the plank
    for (let g = 0; g < 10; g++) {
      const y = i * plankHeight + Math.random() * plankHeight
      ctx.strokeStyle = `rgba(20, 10, 4, ${0.04 + Math.random() * 0.08})`
      ctx.lineWidth = 0.5 + Math.random() * 1.5
      ctx.beginPath()
      ctx.moveTo(0, y)
      for (let x = 0; x <= size; x += 32) {
        ctx.lineTo(x, y + (Math.random() - 0.5) * 5)
      }
      ctx.stroke()
    }

    // Plank seam
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(0, i * plankHeight)
    ctx.lineTo(size, i * plankHeight)
    ctx.stroke()
  }

  // Faint vertical seams so planks read as individual boards
  for (let x = 0; x < size; x += size / 4) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, size)
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(5, 5)
  tex.anisotropy = 4
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
