import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

// Usage: node scripts/probe-pixel.mjs <png> <x,y> [<x,y> ...]
const [png, ...coords] = process.argv.slice(2)
const b64 = readFileSync(png).toString('base64')

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
})
const page = await browser.newPage()
const results = await page.evaluate(async ({ b64, coords }) => {
  const img = new Image()
  img.src = 'data:image/png;base64,' + b64
  await img.decode()
  const c = document.createElement('canvas')
  c.width = img.width
  c.height = img.height
  const ctx = c.getContext('2d')
  ctx.drawImage(img, 0, 0)
  return coords.map((s) => {
    const [x, y] = s.split(',').map(Number)
    const d = ctx.getImageData(x, y, 1, 1).data
    return `${s} -> rgb(${d[0]}, ${d[1]}, ${d[2]})`
  })
}, { b64, coords })
console.log(results.join('\n'))
await browser.close()
