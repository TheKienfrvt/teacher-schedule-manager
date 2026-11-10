import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabaseSessions } from './sessions-gateway'

const api = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('../../lib/supabase', () => ({ getSupabase: () => ({ from: api.from }) }))

beforeEach(() => api.from.mockReset())

describe('sessions API boundary', () => {
  it('requests only sessions intersecting the visible time window', async () => {
    const query = {
      select: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(), gt: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    api.from.mockReturnValue(query)
    await supabaseSessions.list({ startAt: '2026-11-08T17:00:00Z', endAt: '2026-11-15T17:00:00Z' })
    expect(query.lt).toHaveBeenCalledWith('planned_start_at', '2026-11-15T17:00:00Z')
    expect(query.gt).toHaveBeenCalledWith('planned_end_at', '2026-11-08T17:00:00Z')
  })
})
