import { describe, expect, it } from 'vitest'
import { calculateCharge } from './money'

describe('calculateCharge', () => {
  it('charges each 90-minute lesson at its own hourly rate', () => {
    expect(calculateCharge(100_000, 90)).toBe(150_000)
    expect(calculateCharge(120_000, 90)).toBe(180_000)
  })

  it('rounds a half VND up for one student lesson', () => {
    expect(calculateCharge(100_001, 30)).toBe(50_001)
  })

  it('rejects invalid amounts or minutes', () => {
    expect(() => calculateCharge(-1, 60)).toThrow()
    expect(() => calculateCharge(100_000, 0)).toThrow()
    expect(() => calculateCharge(100_000.5, 30)).toThrow()
  })
})
