// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from 'node:fs'
import path from 'node:path'
import jpeg from 'jpeg-js'
import { createWorker, type Worker } from 'tesseract.js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { extractTrade } from './extractTrade'
import { wordsFromBlocks } from './layout'
import { preprocess, type RgbaImage } from './preprocess'

// Real Tesseract on real Robinhood screenshots, through the same preprocess →
// layout → extract pipeline the browser uses (only the image I/O differs).
const OCR_TIMEOUT_MS = 60_000
const JPEG_QUALITY = 95
const fixturesDir = path.join(import.meta.dirname, '__fixtures__')
const langPath = path.resolve('node_modules/@tesseract.js-data/eng/4.0.0_best_int')

let worker: Worker

beforeAll(async () => {
  worker = await createWorker('eng', 1, { langPath, cacheMethod: 'none' })
}, OCR_TIMEOUT_MS)

afterAll(async () => {
  await worker.terminate()
})

function loadFixture(name: string): RgbaImage {
  const decoded = jpeg.decode(readFileSync(path.join(fixturesDir, name)), { useTArray: true })
  return { width: decoded.width, height: decoded.height, data: new Uint8ClampedArray(decoded.data) }
}

function invert(image: RgbaImage): RgbaImage {
  const data = image.data.map((value, i) => (i % 4 === 3 ? value : 255 - value))
  return { ...image, data }
}

async function read(image: RgbaImage) {
  const prepared = preprocess(image)
  const encoded = jpeg.encode({ ...prepared, data: Buffer.from(prepared.data) }, JPEG_QUALITY).data
  const { data } = await worker.recognize(Buffer.from(encoded), {}, { blocks: true })
  return extractTrade(wordsFromBlocks(data.blocks))
}

const cases = [
  {
    fixture: 'robinhood-order-filled.jpeg',
    expected: { ticker: 'CRWV', strike: 90, expiry: '10/23', contracts: 50, premium: 4.03, premiumSource: 'derived-from-total' },
  },
  {
    fixture: 'robinhood-position.jpeg',
    expected: { ticker: 'BE', strike: 280, expiry: '10/23', contracts: 30, premium: 17.3, premiumSource: 'average-cost' },
  },
  {
    fixture: 'robinhood-order-detail.jpeg',
    expected: { ticker: 'AVGO', strike: 420, expiry: '10/30', contracts: 400, premium: 1.29, premiumSource: 'fill' },
  },
]

describe('OCR on Robinhood screenshots', () => {
  it.each(cases)('reads $fixture', async ({ fixture, expected }) => {
    expect(await read(loadFixture(fixture))).toMatchObject({ ...expected, optionType: 'Call', side: 'buy' })
  }, OCR_TIMEOUT_MS)

  it.each(cases)('reads $fixture in dark mode', async ({ fixture, expected }) => {
    expect(await read(invert(loadFixture(fixture)))).toMatchObject(expected)
  }, OCR_TIMEOUT_MS)
})
