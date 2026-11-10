import { describe, expect, it } from 'vitest'
import { createPlannedInterval, formatVietnamTime } from './session-time'

describe('planned session time', () => {
  it('turns 18:00 plus 90 minutes into 19:30 in Vietnam', () => {
    const interval = createPlannedInterval('2026-11-09', '18:00', 90)
    expect(interval).toEqual({
      startAt: '2026-11-09T11:00:00.000Z',
      endAt: '2026-11-09T12:30:00.000Z',
    })
    expect(formatVietnamTime(interval.endAt)).toBe('19:30')
  })

  it('rejects a non-positive duration', () => {
    expect(() => createPlannedInterval('2026-11-09', '18:00', 0)).toThrow('Số phút phải lớn hơn 0')
  })

  it('rejects an impossible calendar date', () => {
    expect(() => createPlannedInterval('2026-02-30', '18:00', 60)).toThrow('Ngày hoặc giờ không hợp lệ')
  })
})
