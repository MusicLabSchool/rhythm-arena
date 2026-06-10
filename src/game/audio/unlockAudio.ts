import { audioEngine } from './NativeAudioEngine'

let attached = false

export function attachAudioUnlock(): void {
  if (attached) return
  attached = true

  const unlock = async () => {
    try {
      await audioEngine.unlock()
    } catch (err) {
      console.warn('Audio unlock failed', err)
    }
  }

  window.addEventListener('pointerdown', unlock, { once: true })
  window.addEventListener('touchstart', unlock, { once: true })
  window.addEventListener('keydown', unlock, { once: true })
}
