// Converts a (possibly huge) EXR environment map into a small Radiance .hdr
// suitable for runtime IBL. Usage:
//   node scripts/convert-hdri.mjs <in.exr> <out.hdr> [targetWidth=1024]
import { readFileSync, writeFileSync } from 'node:fs'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import { DataUtils } from 'three'

const [inPath, outPath, targetWStr] = process.argv.slice(2)
const targetW = Number(targetWStr ?? 1024)

const buf = readFileSync(inPath)
const exr = new EXRLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
const { width, height, data } = exr
const channels = data.length / (width * height)
const isHalf = data.constructor.name === 'Uint16Array'
console.log(`in: ${width}x${height}, ${channels}ch, ${data.constructor.name}`)

const toFloat = (v) => (isHalf ? DataUtils.fromHalfFloat(v) : v)

// Box-filter downsample to targetW x targetW/2
const outW = targetW
const outH = Math.round(targetW / 2)
const fx = width / outW
const fy = height / outH
const out = new Float32Array(outW * outH * 3)
for (let y = 0; y < outH; y++) {
  const y0 = Math.floor(y * fy)
  const y1 = Math.min(height, Math.ceil((y + 1) * fy))
  for (let x = 0; x < outW; x++) {
    const x0 = Math.floor(x * fx)
    const x1 = Math.min(width, Math.ceil((x + 1) * fx))
    let r = 0, g = 0, b = 0, n = 0
    for (let sy = y0; sy < y1; sy++) {
      for (let sx = x0; sx < x1; sx++) {
        const i = (sy * width + sx) * channels
        r += toFloat(data[i])
        g += toFloat(data[i + 1])
        b += toFloat(data[i + 2])
        n++
      }
    }
    const o = (y * outW + x) * 3
    out[o] = r / n
    out[o + 1] = g / n
    out[o + 2] = b / n
  }
}

// EXR rows are bottom-up after EXRLoader parse (flipY semantics); Radiance
// "-Y h +X w" stores top-down, so flip vertically when writing.
function toRGBE(r, g, b) {
  const m = Math.max(r, g, b)
  if (m <= 1e-32) return [0, 0, 0, 0]
  const e = Math.floor(Math.log2(m)) + 1
  const scale = 256 / 2 ** e
  return [
    Math.min(255, Math.floor(r * scale)),
    Math.min(255, Math.floor(g * scale)),
    Math.min(255, Math.floor(b * scale)),
    e + 128,
  ]
}

const header = `#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${outH} +X ${outW}\n`
const chunks = [Buffer.from(header, 'ascii')]
const comps = [new Uint8Array(outW), new Uint8Array(outW), new Uint8Array(outW), new Uint8Array(outW)]
for (let y = 0; y < outH; y++) {
  const srcY = outH - 1 - y
  for (let x = 0; x < outW; x++) {
    const o = (srcY * outW + x) * 3
    const [r, g, b, e] = toRGBE(out[o], out[o + 1], out[o + 2])
    comps[0][x] = r
    comps[1][x] = g
    comps[2][x] = b
    comps[3][x] = e
  }
  // "New RLE" scanline with literal (uncompressed) runs of <=127 bytes.
  const line = [Buffer.from([2, 2, (outW >> 8) & 0xff, outW & 0xff])]
  for (const comp of comps) {
    for (let x = 0; x < outW; x += 127) {
      const run = comp.subarray(x, Math.min(x + 127, outW))
      line.push(Buffer.from([run.length]), Buffer.from(run))
    }
  }
  chunks.push(Buffer.concat(line))
}
writeFileSync(outPath, Buffer.concat(chunks))
console.log(`out: ${outPath} (${outW}x${outH}, ${Buffer.concat(chunks).length} bytes)`)
