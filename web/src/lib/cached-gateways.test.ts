import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearCachedOwner } from './browser-data-cache'
import { createCachedStudentsGateway } from './cached-gateways'
import type { StudentsGateway } from '../features/students/students-gateway'

beforeEach(() => { sessionStorage.clear(); clearCachedOwner('teacher-a') })

describe('cached students gateway', () => {
  it('reuses student data between page visits and reloads it after a write', async () => {
    let rows = [{ id: 'an', name: 'An', contact: null, notes: null, rates: [] }]
    const list = vi.fn(async () => rows)
    const base: StudentsGateway = {
      list,
      create: async () => { rows = [{ id: 'binh', name: 'Bình', contact: null, notes: null, rates: [] }] },
      update: vi.fn(), addRate: vi.fn(),
    }
    const firstPage = createCachedStudentsGateway('teacher-a', base)
    const secondPage = createCachedStudentsGateway('teacher-a', base)
    expect((await firstPage.list())[0].name).toBe('An')
    expect((await secondPage.list())[0].name).toBe('An')
    expect(list).toHaveBeenCalledOnce()
    await firstPage.create({ name: 'Bình', contact: '', notes: '', effectiveFrom: '2026-11-10', rateVndPerHour: 120000 })
    expect((await secondPage.list())[0].name).toBe('Bình')
    expect(list).toHaveBeenCalledTimes(2)
  })
})
