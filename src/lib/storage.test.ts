import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadMyPortfolio, saveMyPortfolio } from './storage'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('my portfolio storage', () => {
  it('returns an empty string when nothing is saved', () => {
    expect(loadMyPortfolio()).toBe('')
  })

  it('saves and loads the portfolio value', () => {
    saveMyPortfolio('40,000')
    expect(loadMyPortfolio()).toBe('40,000')
  })

  it('clears the saved value when given an empty string', () => {
    saveMyPortfolio('40000')
    saveMyPortfolio('   ')
    expect(loadMyPortfolio()).toBe('')
  })

  it('falls back quietly when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(loadMyPortfolio()).toBe('')
    expect(() => saveMyPortfolio('40000')).not.toThrow()
  })
})
