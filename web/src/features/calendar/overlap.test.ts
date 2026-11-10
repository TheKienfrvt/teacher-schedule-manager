import { describe, expect, it } from 'vitest'
import { findOverlaps, type CalendarSlot } from './overlap'

const existing: CalendarSlot[] = [
  { id: 'one', startAt: '2026-11-09T11:00:00.000Z', endAt: '2026-11-09T12:00:00.000Z', studentIds: ['an'] },
  { id: 'two', startAt: '2026-11-09T12:00:00.000Z', endAt: '2026-11-09T13:00:00.000Z', studentIds: ['binh'] },
]

describe('findOverlaps', () => {
  it('warns for the intersecting part of another session', () => {
    const candidate: CalendarSlot = { id: 'new', startAt: '2026-11-09T11:30:00.000Z', endAt: '2026-11-09T12:30:00.000Z', studentIds: ['an'] }
    expect(findOverlaps(candidate, existing).map((slot) => slot.id)).toEqual(['one', 'two'])
  })

  it('does not warn when sessions only touch at their endpoints', () => {
    const candidate: CalendarSlot = { id: 'new', startAt: '2026-11-09T13:00:00.000Z', endAt: '2026-11-09T14:00:00.000Z', studentIds: ['an'] }
    expect(findOverlaps(candidate, existing)).toEqual([])
  })

  it('ignores a soft-deleted session and the edited session itself', () => {
    const candidate: CalendarSlot = { id: 'one', startAt: '2026-11-09T11:30:00.000Z', endAt: '2026-11-09T12:30:00.000Z', studentIds: ['an'] }
    const slots = [...existing, { id: 'deleted', startAt: '2026-11-09T11:30:00.000Z', endAt: '2026-11-09T12:30:00.000Z', studentIds: ['an'], deletedAt: '2026-11-09T10:00:00.000Z' }]
    expect(findOverlaps(candidate, slots).map((slot) => slot.id)).toEqual(['two'])
  })
})
