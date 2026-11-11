import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSupabase } from '../../lib/supabase'
import { supabaseAuth } from './auth-gateway'

vi.mock('../../lib/supabase', () => ({ getSupabase: vi.fn() }))

beforeEach(() => vi.resetAllMocks())

describe('Supabase auth events', () => {
  it('checks the account on sign-in changes without rechecking on token refresh', () => {
    vi.useFakeTimers()
    let emit!: (event: string, session: { user: { id: string } } | null) => void
    const unsubscribe = vi.fn()
    vi.mocked(getSupabase).mockReturnValue({
      auth: {
        onAuthStateChange: (callback: typeof emit) => {
          emit = callback
          return { data: { subscription: { unsubscribe } } }
        },
      },
    } as never)
    const onChange = vi.fn()
    const stop = supabaseAuth.subscribe(onChange)

    emit('INITIAL_SESSION', { user: { id: 'teacher-a' } })
    emit('SIGNED_IN', { user: { id: 'teacher-a' } })
    emit('TOKEN_REFRESHED', { user: { id: 'teacher-a' } })
    emit('SIGNED_OUT', null)

    expect(onChange).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(onChange.mock.calls).toEqual([['teacher-a'], [null]])
    stop()
    expect(unsubscribe).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })
})
