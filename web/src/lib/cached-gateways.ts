import type { StudentsGateway } from '../features/students/students-gateway'
import type { SessionsGateway } from '../features/sessions/sessions-gateway'
import { cachedRead, invalidateCachedGroup, invalidateCachedRead } from './browser-data-cache'

export function createCachedStudentsGateway(ownerId: string, base: StudentsGateway): StudentsGateway {
  return {
    list: () => cachedRead(ownerId, 'students', () => base.list()),
    async create(draft) { await base.create(draft); invalidateCachedRead(ownerId, 'students') },
    async update(id, details) { await base.update(id, details); invalidateCachedRead(ownerId, 'students') },
    async addRate(id, effectiveFrom, rateVndPerHour) {
      await base.addRate(id, effectiveFrom, rateVndPerHour)
      invalidateCachedRead(ownerId, 'students')
    },
  }
}

export function createCachedSessionsGateway(ownerId: string, base: SessionsGateway): SessionsGateway {
  return {
    list: (window) => cachedRead(ownerId, `sessions:${window.startAt}:${window.endAt}`, () => base.list(window)),
    async create(draft) { await base.create(draft); invalidateCachedGroup(ownerId, 'sessions:') },
    async update(id, draft) { await base.update(id, draft); invalidateCachedGroup(ownerId, 'sessions:') },
    async softDelete(id) { await base.softDelete(id); invalidateCachedGroup(ownerId, 'sessions:') },
  }
}
