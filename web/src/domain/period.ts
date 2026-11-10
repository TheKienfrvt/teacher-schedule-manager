export function vietnamDateForInstant(instant: string): string {
  const date = new Date(instant)
  if (Number.isNaN(date.getTime())) throw new Error('Thời điểm không hợp lệ')
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  return `${year}-${month}-${day}`
}

export function periodForInstant(instant: string): string {
  return vietnamDateForInstant(instant).slice(0, 7)
}
