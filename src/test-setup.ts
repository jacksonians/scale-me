import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom has no working object URLs for its File objects; screenshot previews
// only need a placeholder
if (typeof window !== 'undefined') {
  URL.createObjectURL = () => 'blob:preview'
  URL.revokeObjectURL = () => {}
}

afterEach(() => {
  // Node-environment tests (real OCR) have no DOM to reset
  if (typeof window === 'undefined') {
    return
  }
  cleanup()
  localStorage.clear()
  window.history.replaceState(null, '', '/')
})
