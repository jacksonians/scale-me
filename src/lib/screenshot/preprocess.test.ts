import { describe, expect, it } from 'vitest'
import { preprocess, upscaleFactor, type RgbaImage } from './preprocess'

function solid(width: number, height: number, [r, g, b]: [number, number, number]): RgbaImage {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
    data[i + 3] = 255
  }
  return { width, height, data }
}

function pixel(image: RgbaImage, x: number, y: number): number[] {
  const i = (y * image.width + x) * 4
  return Array.from(image.data.slice(i, i + 4))
}

describe('upscaleFactor', () => {
  it('enlarges small screenshots so small UI text is legible to OCR', () => {
    expect(upscaleFactor(310)).toBe(3)
    expect(upscaleFactor(646)).toBe(2)
    expect(upscaleFactor(995)).toBe(2)
  })

  it('leaves full-resolution phone screenshots alone', () => {
    expect(upscaleFactor(1179)).toBe(2)
    expect(upscaleFactor(1290)).toBe(1)
    expect(upscaleFactor(3000)).toBe(1)
  })
})

describe('preprocess', () => {
  it('upscales and converts to grayscale', () => {
    const out = preprocess(solid(4, 2, [200, 100, 50]))
    expect(out.width).toBe(12)
    expect(out.height).toBe(6)
    const [r, g, b, a] = pixel(out, 5, 3)
    expect(r).toBe(g)
    expect(g).toBe(b)
    expect(a).toBe(255)
  })

  it('keeps light screenshots dark-on-light', () => {
    const out = preprocess(solid(2000, 2, [250, 250, 250]))
    expect(pixel(out, 0, 0)[0]).toBeGreaterThan(200)
  })

  it('inverts dark-mode screenshots so text is dark on light', () => {
    const out = preprocess(solid(2000, 2, [10, 10, 10]))
    expect(pixel(out, 0, 0)[0]).toBeGreaterThan(200)
  })

  it('interpolates between neighbouring pixels when upscaling', () => {
    const image = solid(3, 1, [255, 255, 255])
    image.data.set([0, 0, 0, 255], 8)
    const out = preprocess(image)
    const row = Array.from({ length: out.width }, (_, x) => pixel(out, x, 0)[0] ?? 0)
    expect(row[0]).toBe(255)
    expect(row[row.length - 1]).toBe(0)
    expect(row.some((value) => value > 0 && value < 255)).toBe(true)
  })
})
