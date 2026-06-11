import { chromium } from 'playwright'

const exec = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const url = process.env.SHOT_URL ?? 'http://localhost:5173/'
const out = process.env.SHOT_OUT ?? '/tmp/shot.png'
const w = Number(process.env.SHOT_W ?? 390)
const h = Number(process.env.SHOT_H ?? 740)
const clicks = (process.env.SHOT_CLICKS ?? '').split(';').filter(Boolean)
const waitMs = Number(process.env.SHOT_WAIT ?? 2500)

const browser = await chromium.launch({
  executablePath: exec,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
})
const page = await browser.newPage({ viewport: { width: w, height: h } })
page.on('console', (m) => { if (m.type() === 'error') console.log('PAGE ERROR:', m.text()) })
page.on('pageerror', (e) => console.log('PAGE EXCEPTION:', e.message))
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
for (const sel of clicks) {
  try {
    await page.click(sel, { timeout: 4000 })
    await page.waitForTimeout(800)
  } catch (e) {
    console.log('CLICK FAILED:', sel, e.message.split('\n')[0])
  }
}
await page.waitForTimeout(waitMs)
await page.screenshot({ path: out })
await browser.close()
console.log('saved', out)
