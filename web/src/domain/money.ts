export function calculateCharge(rateVndPerHour: number, actualMinutes: number): number {
  if (!Number.isSafeInteger(rateVndPerHour) || rateVndPerHour < 0) throw new Error('Đơn giá phải là số nguyên VND không âm')
  if (!Number.isSafeInteger(actualMinutes) || actualMinutes <= 0) throw new Error('Số phút thực học phải là số nguyên dương')
  const charge = (BigInt(rateVndPerHour) * BigInt(actualMinutes) + 30n) / 60n
  if (charge > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Số tiền vượt giới hạn an toàn')
  return Number(charge)
}
