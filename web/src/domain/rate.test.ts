import { describe, expect, it } from 'vitest'
import { selectEffectiveRate, type RateRecord } from './rate'

const history: RateRecord[] = [
  { studentId: 'an', effectiveFrom: '2026-11-01', rateVndPerHour: 100_000 },
  { studentId: 'an', effectiveFrom: '2026-11-10', rateVndPerHour: 120_000 },
  { studentId: 'binh', effectiveFrom: '2026-11-01', rateVndPerHour: 150_000 },
]

describe('selectEffectiveRate', () => {
  it('uses the old rate for a lesson before the new effective date', () => {
    expect(selectEffectiveRate('an', '2026-11-09T11:00:00Z', history)).toBe(100_000)
  })

  it('uses Vietnam local date when the lesson starts after midnight there', () => {
    expect(selectEffectiveRate('an', '2026-11-09T17:30:00Z', history)).toBe(120_000)
  })

  it('never takes another student’s rate', () => {
    expect(selectEffectiveRate('binh', '2026-11-09T11:00:00Z', history)).toBe(150_000)
  })

  it('rejects a lesson with no effective rate', () => {
    expect(() => selectEffectiveRate('an', '2026-10-31T11:00:00Z', history)).toThrow('Chưa có đơn giá hiệu lực')
  })
})
