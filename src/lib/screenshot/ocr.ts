import type { Worker } from 'tesseract.js'
import { extractTrade, type ExtractedTrade } from './extractTrade'
import { wordsFromBlocks } from './layout'
import { preprocess, type RgbaImage } from './preprocess'

export type OcrStage = 'loading-engine' | 'reading'

// Assets are self-hosted under <base>/ocr/ (see scripts/copy-ocr-assets.mjs),
// so no screenshot data or request ever leaves this site.
function assetUrl(file = ''): string {
  return new URL(`${import.meta.env.BASE_URL}ocr/${file}`, window.location.href).href
}

let workerPromise: Promise<Worker> | null = null

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    // Loaded on first use so the multi-megabyte engine stays out of the main bundle
    workerPromise = import('tesseract.js').then(({ createWorker, OEM }) =>
      createWorker('eng', OEM.LSTM_ONLY, {
        workerPath: assetUrl('worker.min.js'),
        corePath: assetUrl(),
        langPath: assetUrl(),
      }),
    )
    // Let a later attempt retry after a failed load (e.g. offline)
    workerPromise.catch(() => {
      workerPromise = null
    })
  }
  return workerPromise
}

function newCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas 2D is not available')
  }
  return [canvas, context]
}

async function decode(file: Blob): Promise<RgbaImage> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap
  const [, context] = newCanvas(width, height)
  context.drawImage(bitmap, 0, 0)
  bitmap.close()
  return context.getImageData(0, 0, width, height)
}

function toCanvas(image: RgbaImage): HTMLCanvasElement {
  const [canvas, context] = newCanvas(image.width, image.height)
  const imageData = context.createImageData(image.width, image.height)
  imageData.data.set(image.data)
  context.putImageData(imageData, 0, 0)
  return canvas
}

export async function readScreenshot(file: Blob, onStage?: (stage: OcrStage) => void): Promise<ExtractedTrade> {
  if (!workerPromise) {
    onStage?.('loading-engine')
  }
  const worker = await getWorker()
  onStage?.('reading')
  const image = preprocess(await decode(file))
  const { data } = await worker.recognize(toCanvas(image), {}, { blocks: true })
  return extractTrade(wordsFromBlocks(data.blocks))
}
