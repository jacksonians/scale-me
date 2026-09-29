# scale-me

Size a big options trade down to your portfolio.

When someone you follow buys 500 contracts, copying them one-for-one is rarely possible. scale-me takes the **reference trade** as a share of the reference trader's portfolio and tells you how many contracts give you the **same share of your portfolio**.

Live: https://jacksonians.github.io/scale-me/

## How the sizing works

```
contract cost      = premium × 100
reference share    = contracts × contract cost ÷ their portfolio
your contracts     = floor(contracts × your portfolio ÷ their portfolio)
your cost          = your contracts × contract cost   (also your max loss for a long call/put)
```

- Results always round **down**, so you never exceed the reference share. The round-up option is shown with its cost and share of your portfolio.
- If your portfolio is too small to match with one contract, the app says so and shows the portfolio size you'd need.
- The rounding step tolerates floating-point drift, so an exact answer of 3 never becomes 2.

## Fill from a screenshot

Drop, paste, or choose a Robinhood screenshot at the top of the page, and the ticker, contracts, and premium fill in. It reads the "order filled" sheet, the order detail page, and the option position page, in light or dark mode.

- The premium is what was actually paid per share. That is the fill price ("400 contracts at $1.29"), else the position's average cost, else the estimated total cost ÷ (contracts × 100). The limit price is used only when none of those appear.
- Values must be read unambiguously. A price that OCR garbles (say "$415" for $4.15) is left blank and flagged instead of guessed.
- OCR is [Tesseract.js](https://github.com/naptha/tesseract.js), loaded the first time a screenshot is added. Its engine and English model are served from this site (`scripts/copy-ocr-assets.mjs` copies them into `public/ocr/` before `dev` and `build`).

The parsing lives in `src/lib/screenshot/`. `ocr.integration.test.ts` runs real OCR on the screenshots in `src/lib/screenshot/__fixtures__/`, so add a fixture there when you find a screen it misreads.

## Privacy

- **Screenshots** are read in your browser and never uploaded.
- **Your portfolio** is saved in your browser's localStorage and is never sent anywhere or included in share links.
- **Share links** contain only the reference trade: `?c=500&p=2.5&rp=10000000&t=NVDA`.

## Development

Requires Node 24 (see `.nvmrc`).

```sh
npm install
npm run dev       # http://localhost:5173/scale-me/
npm test          # Vitest unit + component tests
npm run build     # type-check and build to dist/
npm run preview   # serve the production build
```

Stack: Vite, React, TypeScript, Tailwind CSS v4, Vitest + Testing Library. The math lives in `src/lib/sizing.ts` and has no dependencies.

## Deployment

Every push to `main` runs the tests, builds, and deploys to GitHub Pages via `.github/workflows/deploy.yml`. Pull requests run tests and the build only.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Disclaimer

scale-me is a calculator, not financial advice. It assumes long (bought) calls or puts, where the most you can lose is the premium paid.
