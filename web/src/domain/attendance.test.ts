import { describe, expect, it } from 'vitest'
import { finalizeAttendance } from './attendance'
import type { RateRecord } from './rate'

const rates: RateRecord[] = [
  { studentId: 'an', effectiveFrom: '2026-11-01', rateVndPerHour: 100_000 },
  { studentId: 'binh', effectiveFrom: '2026-11-01', rateVndPerHour: 120_000 },
]

describe('finalizeAttendance', () => {
  it('charges only An when An studies and Bình is absent in the same group', () => {
    const an = finalizeAttendance({ studentId: 'an', status: 'completed', actualStartAt: '2026-11-09T11:00:00Z', actualMinutes: 90 }, rates)
    const binh = finalizeAttendance({ studentId: 'binh', status: 'absent' }, rates)
    expect(an).toMatchObject({ rateSnapshotVndPerHour: 100_000, chargeVnd: 150_000, actualMinutes: 90 })
    expect(binh).toMatchObject({ rateSnapshotVndPerHour: null, chargeVnd: 0, actualMinutes: null })
  })

  it('requires a reason for an individual price override', () => {
    expect(() => finalizeAttendance({ studentId: 'an', status: 'completed', actualStartAt: '2026-11-09T11:00:00Z', actualMinutes: 60, overrideRateVndPerHour: 80_000 }, rates)).toThrow('Cần ghi lý do đổi giá')
  })

  it('snapshots an individual price override with its own charge', () => {
    const row = finalizeAttendance({ studentId: 'an', status: 'completed', actualStartAt: '2026-11-09T11:00:00Z', actualMinutes: 60, overrideRateVndPerHour: 80_000, overrideReason: 'Giảm giá theo thỏa thuận' }, rates)
    expect(row).toMatchObject({ rateSnapshotVndPerHour: 80_000, chargeVnd: 80_000, overrideReason: 'Giảm giá theo thỏa thuận' })
  })
})
