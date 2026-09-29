export interface RgbaImage {
  width: number
  height: number
  data: Uint8ClampedArray
}

// Tesseract reads text best at roughly 30px cap height. Screenshots shared on
// social apps are often downscaled to a few hundred pixels wide, where it
// misreads "$4.15" as "$415", so small images are enlarged first.
const TARGET_WIDTH = 1200
const MAX_UPSCALE = 3
const DARK_MEAN_LUMINANCE = 128

export function upscaleFactor(width: number): number {
  return Math.min(MAX_UPSCALE, Math.max(1, Math.ceil(TARGET_WIDTH / width)))
}

function luminance(data: Uint8ClampedArray, i: number): number {
  return 0.299 * (data[i] ?? 0) + 0.587 * (data[i + 1] ?? 0) + 0.114 * (data[i + 2] ?? 0)
}

// Grayscale, flip dark-mode screenshots to dark-on-light, then upscale with
// bilinear interpolation. Pure pixel math so the browser and Node tests share it.
export function preprocess(image: RgbaImage): RgbaImage {
  const { width, height, data } = image
  const gray = new Float32Array(width * height)
  let total = 0
  for (let p = 0; p < gray.length; p++) {
    const value = luminance(data, p * 4)
    gray[p] = value
    total += value
  }
  if (total / gray.length < DARK_MEAN_LUMINANCE) {
    for (let p = 0; p < gray.length; p++) {
      gray[p] = 255 - (gray[p] ?? 0)
    }
  }

  const scale = upscaleFactor(width)
  const outWidth = width * scale
  const outHeight = height * scale
  const out = new Uint8ClampedArray(outWidth * outHeight * 4)
  const at = (x: number, y: number) => gray[y * width + x] ?? 0

  for (let y = 0; y < outHeight; y++) {
    const sourceY = Math.min(height - 1, Math.max(0, (y + 0.5) / scale - 0.5))
    const y0 = Math.floor(sourceY)
    const y1 = Math.min(height - 1, y0 + 1)
    const fy = sourceY - y0
    for (let x = 0; x < outWidth; x++) {
      const sourceX = Math.min(width - 1, Math.max(0, (x + 0.5) / scale - 0.5))
      const x0 = Math.floor(sourceX)
      const x1 = Math.min(width - 1, x0 + 1)
      const fx = sourceX - x0
      const top = at(x0, y0) * (1 - fx) + at(x1, y0) * fx
      const bottom = at(x0, y1) * (1 - fx) + at(x1, y1) * fx
      const value = top * (1 - fy) + bottom * fy
      const i = (y * outWidth + x) * 4
      out[i] = value
      out[i + 1] = value
      out[i + 2] = value
      out[i + 3] = 255
    }
  }

  return { width: outWidth, height: outHeight, data: out }
}
