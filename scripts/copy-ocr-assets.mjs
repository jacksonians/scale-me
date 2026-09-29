// Copies the Tesseract.js worker, WASM cores, and English model into
// public/ocr/ so the site serves them itself instead of loading from a CDN.
// Runs before `dev` and `build`; the output is gitignored.
import { copyFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const packageDir = (name) => path.dirname(require.resolve(`${name}/package.json`))
const outDir = path.resolve(import.meta.dirname, '../public/ocr')

const tesseract = packageDir('tesseract.js')
const core = packageDir('tesseract.js-core')
const eng = packageDir('@tesseract.js-data/eng')

// The worker picks one LSTM-only core at runtime based on WASM SIMD support
const files = [
  path.join(tesseract, 'dist/worker.min.js'),
  path.join(tesseract, 'dist/worker.min.js.LICENSE.txt'),
  path.join(core, 'tesseract-core-lstm.wasm.js'),
  path.join(core, 'tesseract-core-simd-lstm.wasm.js'),
  path.join(core, 'tesseract-core-relaxedsimd-lstm.wasm.js'),
  path.join(eng, '4.0.0_best_int/eng.traineddata.gz'),
]

mkdirSync(outDir, { recursive: true })
for (const file of files) {
  copyFileSync(file, path.join(outDir, path.basename(file)))
}
console.log(`Copied ${files.length} OCR assets to public/ocr/`)
