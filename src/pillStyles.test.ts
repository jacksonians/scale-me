// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// jsdom can't evaluate media queries, so check the rule itself; a real touch
// browser was used to confirm the effect.
const css = readFileSync(path.join(import.meta.dirname, 'index.css'), 'utf8')
const pill = css.slice(css.indexOf('@utility pill'), css.indexOf('@layer base'))

describe('pill styles', () => {
  it('fills on hover only where a pointer can hover, so a tap on a phone does not leave it filled', () => {
    expect(pill).toMatch(/@media \(hover: hover\)\s*\{\s*&:hover/)
  })

  it('fills while pressed, which is the feedback touch screens get', () => {
    expect(pill).toMatch(/&:active[^{]*\{/)
  })
})
