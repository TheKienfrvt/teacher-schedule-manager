import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cachedRead, clearCachedOwner, invalidateCachedGroup, invalidateCachedRead } from './browser-data-cache'

beforeEach(() => {
  sessionStorage.clear()
  clearCachedOwner('teacher-a')
  clearCachedOwner('teacher-b')
  vi.useRealTimers()
})

describe('browser data cache', () => {
  it('reuses one API result for the same teacher and resource during its lifetime', async () => {
    let calls = 0
    const load = async () => { calls++; return [{ name: 'An' }] }
    expect(await cachedRead('teacher-a', 'students', load)).toEqual([{ name: 'An' }])
    expect(await cachedRead('teacher-a', 'students', load)).toEqual([{ name: 'An' }])
    expect(calls).toBe(1)
    expect(sessionStorage.length).toBe(1)
  })

  it('does not show another teacher cached data', async () => {
    await cachedRead('teacher-a', 'students', async () => [{ name: 'An' }])
    expect(await cachedRead('teacher-b', 'students', async () => [{ name: 'Bình' }])).toEqual([{ name: 'Bình' }])
    expect(sessionStorage.length).toBe(2)
  })

  it('refreshes expired data and changed data after invalidation', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-10T00:00:00Z'))
    let value = 'An'
    const load = async () => [{ name: value }]
    expect(await cachedRead('teacher-a', 'students', load, 60_000)).toEqual([{ name: 'An' }])
    value = 'Bình'
    expect(await cachedRead('teacher-a', 'students', load, 60_000)).toEqual([{ name: 'An' }])
    invalidateCachedRead('teacher-a', 'students')
    expect(await cachedRead('teacher-a', 'students', load, 60_000)).toEqual([{ name: 'Bình' }])
    value = 'Chi'
    vi.advanceTimersByTime(60_001)
    expect(await cachedRead('teacher-a', 'students', load, 60_000)).toEqual([{ name: 'Chi' }])
  })

  it('does not restore private cache when an in-flight read completes after logout', async () => {
    let resolve!: (value: string[]) => void
    const pending = cachedRead('teacher-a', 'sessions', () => new Promise<string[]>((done) => { resolve = done }))
    await Promise.resolve()
    clearCachedOwner('teacher-a')
    resolve(['private session'])
    await pending
    expect(sessionStorage.length).toBe(0)
    expect(await cachedRead('teacher-a', 'sessions', async () => ['fresh'])).toEqual(['fresh'])
  })

  it('coalesces simultaneous reads and does not cache errors', async () => {
    let calls = 0
    let resolve!: (value: number[]) => void
    const load = () => { calls++; return new Promise<number[]>((done) => { resolve = done }) }
    const first = cachedRead('teacher-a', 'students', load)
    const second = cachedRead('teacher-a', 'students', load)
    await Promise.resolve()
    resolve([1])
    expect(await first).toEqual([1])
    expect(await second).toEqual([1])
    expect(calls).toBe(1)
    invalidateCachedRead('teacher-a', 'students')
    await expect(cachedRead('teacher-a', 'students', async () => { throw new Error('offline') })).rejects.toThrow('offline')
    expect(sessionStorage.length).toBe(0)
  })

  it('invalidates every cached calendar window after a session changes', async () => {
    await cachedRead('teacher-a', 'sessions:week-1', async () => ['first'])
    await cachedRead('teacher-a', 'sessions:week-2', async () => ['second'])
    invalidateCachedGroup('teacher-a', 'sessions:')
    expect(await cachedRead('teacher-a', 'sessions:week-1', async () => ['updated first'])).toEqual(['updated first'])
    expect(await cachedRead('teacher-a', 'sessions:week-2', async () => ['updated second'])).toEqual(['updated second'])
  })
})
