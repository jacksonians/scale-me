# Handoff: screenshot OCR load time

Date: 2026-09-29
Status: investigation done, **no changes made yet**. The next step is to implement the changes below.

## Where things are

| | |
|---|---|
| Worktree | `/Users/jli1/.treehouse/scale-me-d2e30a/3/scale-me` |
| Branch | `feature/screenshot-ocr` (pushed to `origin`), commit `2cbd25d` |
| PR | **Not opened yet.** `gh` isn't installed and the GitHub MCP failed to connect. Open it here: https://github.com/jacksonians/scale-me/compare/main...feature/screenshot-ocr?expand=1. The PR description is in the commit message. |
| Main checkout | `/Users/jli1/repos/scale-me` is on an old `main` (`94e396c`). Run `git pull` there before starting other work. |

### What the feature is (already built)
A "Fill from a screenshot" card at the top of the page. It reads Robinhood screenshots in the browser with Tesseract.js v7 and fills in the ticker, contracts, and premium.

| File | Role |
|---|---|
| `src/lib/screenshot/ocr.ts` | Browser adapter. `getWorker()` is a lazy singleton, created on the **first screenshot**. `readScreenshot(file, onStage)` runs decode → `preprocess` → recognize → `extractTrade`. |
| `src/lib/screenshot/preprocess.ts` | Pure pixel prep: grayscale, dark-mode invert, and bilinear upscale by `upscaleFactor(width)`. |
| `src/lib/screenshot/layout.ts`, `extractTrade.ts` | Row and cell rebuild, and field extraction. |
| `src/components/ScreenshotImport.tsx` | The UI. Shows "Loading the text reader (first time only)…" while the engine loads. |
| `scripts/copy-ocr-assets.mjs` | Self-hosts the worker, cores, and model into `public/ocr/`. Runs before `dev` and `build`. |

## Why this matters
The user acts on the reference trader's screenshot right away, before the premium moves. Time from "paste screenshot" to "fields filled" is on the critical path.

## Investigation: measured load and read times

**Method:** Chromium through the Playwright MCP, against `npm run dev`. The OCR assets are the same files production serves.
- Timings come from `readScreenshot`'s `onStage` callback. "Engine" is from the screenshot being added until the worker is ready. "Read" is decode + preprocess + OCR + extract.
- A cold first visit clears the HTTP cache and origin storage (IndexedDB holds Tesseract's model cache) through CDP.
- Networks are simulated with CDP `Network.emulateNetworkConditions`.
- Run counts: 3–5 runs per network case, plus 15 runs with the engine already running.

### Results: time from adding a screenshot to filled fields

| Situation | Home Wi-Fi (50 Mbps, 20 ms) | 4G (12 Mbps, 70 ms) | Weak LTE (4 Mbps, 150 ms) |
|---|---|---|---|
| **First visit ever** (engine downloads) | **1.8 s** | **5.8 s** | **15.4 s** |
| **Return visit** (files cached, engine restarts) | 0.52 s | 0.63 s | 0.79 s |
| **Engine already running** | 0.30–0.50 s | same | same |

- **First visit:** almost all the time is downloading about 7 MB of assets. OCR itself adds only about 0.4 s.
  - `tesseract-core-*-lstm.wasm.js`: 3.9 MB, one variant loaded based on the browser's SIMD support
  - `eng.traineddata.gz`: 2.9 MB
  - `worker.min.js`: 0.1 MB
- **Return visit:** Tesseract caches the model in IndexedDB, so only the engine restart (0.1–0.4 s) is added.
- **Engine running, per screenshot:** read times are very stable across 5 runs each.

  | Screenshot | Read time |
  |---|---|
  | Order-filled sheet (310 px wide, upscaled 3×) | about 0.30 s |
  | Order detail (646 px, 2×) | about 0.34 s |
  | Position page (995 px, 2× to 1990 px) | about 0.50 s |

- **Localhost with no throttling:** the cold engine load was only 130–240 ms, so network speed is what makes the first visit slow.

### Caveats (not yet verified)
- **Phones not measured.** CDP CPU throttling (4×) only slows the main thread, not the Web Worker where Tesseract runs. My 4× run (0.36–0.60 s) mostly just slowed `preprocess`. My guess is that a mid-range phone reads in about 1–2 s, but that needs a real device.
- **Throttled timings may be pessimistic.** Vite dev serves uncompressed. GitHub Pages gzips JS, so the 3.9 MB core may transfer smaller in production. The `.gz` model is already compressed.
- **Return visits in production may be slower than measured.** GitHub Pages is believed to send `Cache-Control: max-age=600`, which would make return visits after 10 minutes revalidate the core file (one round trip). This header hasn't been checked.

### Root cause
`getWorker()` only runs inside `readScreenshot()`, so the whole engine download happens after the user adds the screenshot, which is exactly when speed matters.

## What I'd change

### 1. Start the engine when the page opens (main fix)
The engine should download while the user is still switching apps to get the screenshot, so the first read takes about 0.3–0.6 s instead of 2–15 s.
- In `ocr.ts`, export `preloadOcr(): void` that calls `getWorker()` and logs any failure. It should *not* throw, and the existing `.catch` reset already allows a retry.
- In `ScreenshotImport.tsx`, on mount, call `preloadOcr()` when the browser is idle: `requestIdleCallback` with a `setTimeout` fallback, since Safari lacks `requestIdleCallback`.
- Fix the loading-state bug this introduces. `readScreenshot` currently decides whether to show `'loading-engine'` with `if (!workerPromise)`. With preload, the promise can exist but still be pending, and the UI would wrongly say "Reading…". Track readiness separately, e.g. a `workerReady` flag set when the promise resolves, and emit `'loading-engine'` whenever it isn't ready yet.
- Optionally skip the preload when `navigator.connection?.saveData` is true, and load on demand as now.
- **Tests:** add `preloadOcr: vi.fn()` to the `vi.mock('../lib/screenshot/ocr', …)` factories in `ScreenshotImport.test.tsx` and `App.test.tsx`. Add a test that mount calls `preloadOcr`, and one that a read started while the engine is loading shows the loading message.
- **Trade-off:** every visitor downloads about 7 MB, even if they never use screenshots. The model is kept in IndexedDB and the core in the HTTP cache, so it's mostly a one-time cost per device.

### 2. Upscale large images less (smaller win, needs care)
The position page (995 px) is doubled to 1990 px, which makes it the slowest read (0.50 s).
- **Warning:** 1× does not work. Raw OCR of this image at 1× misread `$17.43` as `$1743` and `+30` as `+0`. So the fix is not `upscaleFactor(995) === 1`.
- Try a fractional factor, e.g. about 1.5× for 800–1200 px wide images. `preprocess` assumes an integer `scale` (`outWidth = width * scale`). Switch to `Math.round(width * scale)`, and compute source coordinates from `outWidth / width`.
- **Confirm:** `ocr.integration.test.ts` must still pass, light and dark, for all 3 fixtures. Re-time the position page. I estimated it would drop to about 0.3 s, but that is unmeasured.

### 3. Model caching (already in place)
Tesseract.js's default `cacheMethod` stores the model in IndexedDB, which is why return visits skip the 2.9 MB model download. No change is needed; keep it that way.

## How to re-run the benchmark
1. Run `npm run dev -- --port 5301 --strictPort`.
2. In the Playwright MCP, run this through `browser_evaluate` once the page has loaded:

```js
async () => {
  const m = await import('/scale-me/src/lib/screenshot/ocr.ts')
  const b = await fetch('/scale-me/src/lib/screenshot/__fixtures__/robinhood-order-detail.jpeg').then((r) => r.blob())
  const t0 = performance.now(); let ready = t0
  await m.readScreenshot(b, (s) => { if (s === 'reading') ready = performance.now() })
  return { engine: Math.round(ready - t0), read: Math.round(performance.now() - ready) }
}
```

3. For the other scenarios, use `browser_run_code_unsafe` with a CDP session (`page.context().newCDPSession(page)`):
   - **Cold first visit:** `Network.clearBrowserCache` + `Storage.clearDataForOrigin({ origin, storageTypes: 'all' })`, then reload.
   - **Throttling:** `Network.emulateNetworkConditions({ latency, downloadThroughput: bytesPerSec, uploadThroughput })`.
4. After change 1, the number to watch is a first visit on 4G where the screenshot is added about 5 s after page load. It should be close to the "engine already running" row. Then check on a real phone.
