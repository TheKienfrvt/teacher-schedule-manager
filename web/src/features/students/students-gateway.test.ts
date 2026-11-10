import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabaseStudents } from './students-gateway'

const api = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('../../lib/supabase', () => ({ getSupabase: () => ({ from: api.from }) }))

beforeEach(() => { api.from.mockReset() })

function respondWith(rate: string) {
  const query = {
    select: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [{
      id: 'an', name: 'An', contact: null, notes: null,
      rate_history: [{ id: 'r1', effective_from: '2026-11-01', rate_vnd_per_hour: rate }],
    }], error: null }),
  }
  api.from.mockReturnValue(query)
}

describe('students API boundary', () => {
  it('loads students and their rates in one request', async () => {
    respondWith('100000')
    expect(await supabaseStudents.list()).toEqual([{
      id: 'an', name: 'An', contact: null, notes: null,
      rates: [{ id: 'r1', effectiveFrom: '2026-11-01', rateVndPerHour: 100000 }],
    }])
    expect(api.from).toHaveBeenCalledTimes(1)
  })

  it('rejects a database rate outside JavaScript safe integer range', async () => {
    respondWith('9007199254740993')
    await expect(supabaseStudents.list()).rejects.toThrow('Đơn giá vượt giới hạn số an toàn')
  })
})
