import { describe, expect, it } from 'vitest'
import { periodForInstant } from './period'

describe('periodForInstant', () => {
  it('keeps a lesson starting at 23:30 Vietnam time in November', () => {
    expect(periodForInstant('2026-11-30T16:30:00.000Z')).toBe('2026-11')
  })

  it('moves a lesson starting after midnight Vietnam time to December', () => {
    expect(periodForInstant('2026-11-30T17:05:00.000Z')).toBe('2026-12')
  })
})
