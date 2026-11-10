import { calculateCharge } from './money'
import { selectEffectiveRate } from './rate'
import type { RateRecord } from './rate'

export type AttendanceDecision =
  | { studentId: string, status: 'completed', actualStartAt: string, actualMinutes: number, overrideRateVndPerHour?: number, overrideReason?: string }
  | { studentId: string, status: 'absent' | 'cancelled' }

export type FinalizedAttendance = {
  studentId: string
  status: 'completed' | 'absent' | 'cancelled'
  actualStartAt: string | null
  actualMinutes: number | null
  rateSnapshotVndPerHour: number | null
  chargeVnd: number
  overrideReason: string | null
}

export function finalizeAttendance(decision: AttendanceDecision, rates: RateRecord[]): FinalizedAttendance {
  if (decision.status !== 'completed') {
    return { studentId: decision.studentId, status: decision.status, actualStartAt: null, actualMinutes: null, rateSnapshotVndPerHour: null, chargeVnd: 0, overrideReason: null }
  }
  if (Number.isNaN(new Date(decision.actualStartAt).getTime())) throw new Error('Giờ bắt đầu thực học không hợp lệ')
  const hasOverride = decision.overrideRateVndPerHour !== undefined
  const reason = decision.overrideReason?.trim() || null
  if (hasOverride && !reason) throw new Error('Cần ghi lý do đổi giá')
  const rate = hasOverride ? decision.overrideRateVndPerHour! : selectEffectiveRate(decision.studentId, decision.actualStartAt, rates)
  const charge = calculateCharge(rate, decision.actualMinutes)
  return {
    studentId: decision.studentId,
    status: 'completed',
    actualStartAt: decision.actualStartAt,
    actualMinutes: decision.actualMinutes,
    rateSnapshotVndPerHour: rate,
    chargeVnd: charge,
    overrideReason: hasOverride ? reason : null,
  }
}
