import { vietnamDateForInstant } from './period'

export type RateRecord = { studentId: string, effectiveFrom: string, rateVndPerHour: number }

export function selectEffectiveRate(studentId: string, actualStartAt: string, history: RateRecord[]): number {
  const localDate = vietnamDateForInstant(actualStartAt)
  const effective = history
    .filter((rate) => rate.studentId === studentId && rate.effectiveFrom <= localDate)
    .sort((left, right) => right.effectiveFrom.localeCompare(left.effectiveFrom))[0]
  if (!effective) throw new Error('Chưa có đơn giá hiệu lực')
  return effective.rateVndPerHour
}
