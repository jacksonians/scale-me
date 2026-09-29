import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ExtractedTrade } from '../lib/screenshot/extractTrade'
import { readScreenshot } from '../lib/screenshot/ocr'
import { ScreenshotImport } from './ScreenshotImport'

vi.mock('../lib/screenshot/ocr', () => ({ readScreenshot: vi.fn() }))

const readMock = vi.mocked(readScreenshot)

const CRWV: ExtractedTrade = {
  ticker: 'CRWV',
  strike: 90,
  optionType: 'Call',
  expiry: '10/23',
  side: 'buy',
  contracts: 50,
  premium: 4.03,
  premiumSource: 'derived-from-total',
}

const image = (name = 'trade.png') => new File(['pixels'], name, { type: 'image/png' })

function renderImport() {
  const onExtracted = vi.fn()
  render(<ScreenshotImport onExtracted={onExtracted} />)
  return onExtracted
}

function status() {
  return screen.getByRole('status')
}

beforeEach(() => {
  readMock.mockReset()
})

describe('ScreenshotImport', () => {
  it('reads a chosen screenshot and reports what it found', async () => {
    readMock.mockResolvedValue(CRWV)
    const user = userEvent.setup()
    const onExtracted = renderImport()

    await user.upload(screen.getByLabelText(/choose image/i), image())

    expect(onExtracted).toHaveBeenCalledWith(CRWV)
    expect(status()).toHaveTextContent('Read CRWV $90 Call 10/23 · 50 contracts · $4.03 per share')
    expect(status()).toHaveTextContent('worked out from the total cost')
    expect(screen.getByRole('img', { name: 'Screenshot preview' })).toBeInTheDocument()
  })

  it('shows progress while the engine loads and reads', async () => {
    let finish: (trade: ExtractedTrade) => void = () => {}
    readMock.mockImplementation((_file, onStage) => {
      onStage?.('loading-engine')
      return new Promise((resolve) => {
        finish = resolve
      })
    })
    const user = userEvent.setup()
    renderImport()

    await user.upload(screen.getByLabelText(/choose image/i), image())
    expect(status()).toHaveTextContent(/loading the text reader/i)

    await act(async () => finish(CRWV))
    expect(status()).toHaveTextContent('Read CRWV')
  })

  it('reads an image pasted anywhere on the page', async () => {
    readMock.mockResolvedValue(CRWV)
    const onExtracted = renderImport()
    const file = image()

    const paste = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(paste, 'clipboardData', { value: { files: [file] } })
    await act(async () => {
      document.dispatchEvent(paste)
    })

    expect(readMock).toHaveBeenCalledWith(file, expect.any(Function))
    expect(onExtracted).toHaveBeenCalledWith(CRWV)
    expect(paste.defaultPrevented).toBe(true)
  })

  it('leaves text pastes alone', async () => {
    renderImport()
    const paste = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(paste, 'clipboardData', { value: { files: [] } })
    await act(async () => {
      document.dispatchEvent(paste)
    })
    expect(readMock).not.toHaveBeenCalled()
    expect(paste.defaultPrevented).toBe(false)
  })

  it('reads a dropped screenshot', async () => {
    readMock.mockResolvedValue(CRWV)
    const onExtracted = renderImport()

    await act(async () => {
      fireEvent.drop(screen.getByTestId('screenshot-dropzone'), { dataTransfer: { files: [image()] } })
    })

    expect(onExtracted).toHaveBeenCalledWith(CRWV)
  })

  it('rejects files that are not images', async () => {
    const onExtracted = renderImport()

    await act(async () => {
      fireEvent.drop(screen.getByTestId('screenshot-dropzone'), {
        dataTransfer: { files: [new File(['%PDF'], 'trade.pdf', { type: 'application/pdf' })] },
      })
    })

    expect(readMock).not.toHaveBeenCalled()
    expect(onExtracted).not.toHaveBeenCalled()
    expect(status()).toHaveTextContent(/isn't an image/i)
  })

  it('says so when nothing trade-like is found', async () => {
    readMock.mockResolvedValue({})
    const user = userEvent.setup()
    const onExtracted = renderImport()

    await user.upload(screen.getByLabelText(/choose image/i), image())

    expect(onExtracted).not.toHaveBeenCalled()
    expect(status()).toHaveTextContent(/couldn't find a robinhood trade/i)
  })

  it('reports OCR failures', async () => {
    readMock.mockRejectedValue(new Error('offline'))
    const user = userEvent.setup()
    const onExtracted = renderImport()

    await user.upload(screen.getByLabelText(/choose image/i), image())

    expect(onExtracted).not.toHaveBeenCalled()
    expect(status()).toHaveTextContent(/couldn't read that screenshot/i)
  })

  it('ignores a slow earlier read once a newer screenshot arrives', async () => {
    let finishFirst: (trade: ExtractedTrade) => void = () => {}
    readMock
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishFirst = resolve
          }),
      )
      .mockResolvedValueOnce(CRWV)
    const user = userEvent.setup()
    const onExtracted = renderImport()
    const input = screen.getByLabelText(/choose image/i)

    await user.upload(input, image('first.png'))
    await user.upload(input, image('second.png'))
    await act(async () => finishFirst({ ticker: 'OLD', contracts: 1, premium: 1 }))

    expect(onExtracted).toHaveBeenCalledTimes(1)
    expect(onExtracted).toHaveBeenCalledWith(CRWV)
    expect(status()).toHaveTextContent('Read CRWV')
  })
})
