export function createPlannedInterval(date: string, time: string, minutes: number): { startAt: string, endAt: string } {
  if (!Number.isInteger(minutes) || minutes <= 0) throw new Error('Số phút phải lớn hơn 0')
  const start = new Date(`${date}T${time}:00+07:00`)
  const roundTrip = Number.isNaN(start.getTime()) ? '' : new Date(start.getTime() + 7 * 60 * 60_000).toISOString().slice(0, 16)
  if (roundTrip !== `${date}T${time}`) throw new Error('Ngày hoặc giờ không hợp lệ')
  const end = new Date(start.getTime() + minutes * 60_000)
  return { startAt: start.toISOString(), endAt: end.toISOString() }
}

export function formatVietnamTime(instant: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(instant))
}
