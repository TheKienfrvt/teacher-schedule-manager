export type CalendarSlot = {
  id: string
  startAt: string
  endAt: string
  studentIds: string[]
  deletedAt?: string | null
}

export function findOverlaps(candidate: CalendarSlot, existing: CalendarSlot[]): CalendarSlot[] {
  const start = new Date(candidate.startAt).getTime()
  const end = new Date(candidate.endAt).getTime()
  return existing.filter((slot) =>
    slot.id !== candidate.id &&
    !slot.deletedAt &&
    start < new Date(slot.endAt).getTime() &&
    new Date(slot.startAt).getTime() < end,
  )
}
