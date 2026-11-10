import { describe, expect, it } from 'vitest'
import { buildMonthlyReport, type AttendanceLine, type Payment } from './monthly-report'

const rows: AttendanceLine[] = [
  { id: 'a1', studentId: 'an', status: 'completed', actualStartAt: '2026-11-03T11:00:00Z', actualMinutes: 90, chargeVnd: 150_000 },
  { id: 'b1', studentId: 'binh', status: 'completed', actualStartAt: '2026-11-03T11:00:00Z', actualMinutes: 90, chargeVnd: 180_000 },
  { id: 'a2', studentId: 'an', status: 'completed', actualStartAt: '2026-11-30T16:30:00Z', actualMinutes: 102, chargeVnd: 170_000 },
  { id: 'a3', studentId: 'an', status: 'scheduled', actualStartAt: null, actualMinutes: null, chargeVnd: 0 },
]

describe('buildMonthlyReport', () => {
  it('counts only the selected student and month including a lesson crossing midnight', () => {
    const report = buildMonthlyReport('an', '2026-11', rows, [], [{ studentId: 'an', period: '2026-11', kind: 'received', amountVnd: 200_000 }])
    expect(report.lessonCount).toBe(2)
    expect(report.totalMinutes).toBe(192)
    expect(report.tuitionVnd).toBe(320_000)
    expect(report.paidVnd).toBe(200_000)
    expect(report.remainingVnd).toBe(120_000)
    expect(report.lines.map((line) => line.id)).toEqual(['a1', 'a2'])
  })

  it('subtracts refunds from paid money once', () => {
    const payments: Payment[] = [
      { studentId: 'an', period: '2026-11', kind: 'received', amountVnd: 200_000 },
      { studentId: 'an', period: '2026-11', kind: 'refund', amountVnd: 50_000 },
    ]
    const report = buildMonthlyReport('an', '2026-11', rows, [], payments)
    expect(report.paidVnd).toBe(150_000)
    expect(report.remainingVnd).toBe(170_000)
  })

  it('shows reconciliation rather than negative amount due after a correction', () => {
    const report = buildMonthlyReport('an', '2026-11', rows, [{ studentId: 'an', period: '2026-11', amountVnd: -150_000 }], [{ studentId: 'an', period: '2026-11', kind: 'received', amountVnd: 200_000 }])
    expect(report.dueVnd).toBe(170_000)
    expect(report.remainingVnd).toBe(0)
    expect(report.reconcileVnd).toBe(30_000)
  })
})
