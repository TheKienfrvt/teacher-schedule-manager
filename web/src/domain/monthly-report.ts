import { periodForInstant } from './period'

export type AttendanceLine = {
  id: string
  studentId: string
  status: 'scheduled' | 'completed' | 'absent' | 'cancelled'
  actualStartAt: string | null
  actualMinutes: number | null
  chargeVnd: number
}

export type FeeAdjustment = { studentId: string, period: string, amountVnd: number }
export type Payment = { studentId: string, period: string, kind: 'received' | 'refund', amountVnd: number }

export type MonthlyReport = {
  lines: AttendanceLine[]
  lessonCount: number
  totalMinutes: number
  tuitionVnd: number
  adjustmentsVnd: number
  dueVnd: number
  paidVnd: number
  remainingVnd: number
  reconcileVnd: number
}

export function buildMonthlyReport(studentId: string, period: string, rows: AttendanceLine[], adjustments: FeeAdjustment[], payments: Payment[]): MonthlyReport {
  const lines = rows.filter((row) => {
    if (row.studentId !== studentId || row.status !== 'completed') return false
    if (!row.actualStartAt || !Number.isSafeInteger(row.actualMinutes) || (row.actualMinutes ?? 0) <= 0) throw new Error('Dòng đã học thiếu thời gian thực tế')
    return periodForInstant(row.actualStartAt) === period
  })
  const sum = (values: number[]) => values.reduce((total, value) => {
    if (!Number.isSafeInteger(value) || !Number.isSafeInteger(total + value)) throw new Error('Số tiền hoặc phút vượt giới hạn an toàn')
    return total + value
  }, 0)
  const totalMinutes = sum(lines.map((row) => row.actualMinutes!))
  const tuitionVnd = sum(lines.map((row) => row.chargeVnd))
  const adjustmentsVnd = sum(adjustments.filter((item) => item.studentId === studentId && item.period === period).map((item) => item.amountVnd))
  const dueVnd = sum([tuitionVnd, adjustmentsVnd])
  const paidVnd = sum(payments.filter((item) => item.studentId === studentId && item.period === period).map((item) => {
    if (!Number.isSafeInteger(item.amountVnd) || item.amountVnd <= 0) throw new Error('Giao dịch phải là số tiền nguyên dương')
    return item.kind === 'refund' ? -item.amountVnd : item.amountVnd
  }))
  const balance = sum([dueVnd, -paidVnd])
  return {
    lines,
    lessonCount: lines.length,
    totalMinutes,
    tuitionVnd,
    adjustmentsVnd,
    dueVnd,
    paidVnd,
    remainingVnd: Math.max(balance, 0),
    reconcileVnd: Math.max(-balance, 0),
  }
}
