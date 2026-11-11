const prefix = 'bong:data:v1:'
const pending = new Map<string, Promise<unknown>>()
const ownerEpoch = new Map<string, number>()
const keyEpoch = new Map<string, number>()

function storage(): Storage | null {
  try { return globalThis.sessionStorage ?? null } catch { return null }
}

function keyFor(ownerId: string, resource: string) {
  return `${prefix}${ownerId}:${resource}`
}

function remove(key: string) {
  try { storage()?.removeItem(key) } catch { /* cache is optional */ }
}

function read<T>(key: string): T | undefined {
  const store = storage()
  if (!store) return undefined
  try {
    const raw = store.getItem(key)
    if (!raw) return undefined
    const entry: unknown = JSON.parse(raw)
    if (typeof entry !== 'object' || entry === null || !('expiresAt' in entry) || !('value' in entry) ||
        typeof entry.expiresAt !== 'number' || entry.expiresAt <= Date.now()) {
      remove(key)
      return undefined
    }
    return entry.value as T
  } catch {
    remove(key)
    return undefined
  }
}

export function invalidateCachedRead(ownerId: string, resource: string) {
  const key = keyFor(ownerId, resource)
  keyEpoch.set(key, (keyEpoch.get(key) ?? 0) + 1)
  pending.delete(key)
  remove(key)
}

export function invalidateCachedGroup(ownerId: string, resourcePrefix: string) {
  const groupPrefix = keyFor(ownerId, resourcePrefix)
  const keys = new Set([...pending.keys()].filter((key) => key.startsWith(groupPrefix)))
  const store = storage()
  if (store) try {
    for (let index = 0; index < store.length; index++) {
      const key = store.key(index)
      if (key?.startsWith(groupPrefix)) keys.add(key)
    }
  } catch { /* cache is optional */ }
  for (const key of keys) invalidateCachedRead(ownerId, key.slice(`${prefix}${ownerId}:`.length))
}

export function clearCachedOwner(ownerId: string) {
  ownerEpoch.set(ownerId, (ownerEpoch.get(ownerId) ?? 0) + 1)
  const ownerPrefix = `${prefix}${ownerId}:`
  for (const key of pending.keys()) if (key.startsWith(ownerPrefix)) pending.delete(key)
  const store = storage()
  if (!store) return
  try {
    for (let index = store.length - 1; index >= 0; index--) {
      const key = store.key(index)
      if (key?.startsWith(ownerPrefix)) remove(key)
    }
  } catch { /* cache is optional */ }
}

export function clearOtherCachedOwners(ownerId: string | null) {
  const otherOwners = new Set<string>()
  const collect = (key: string | null) => {
    if (!key?.startsWith(prefix)) return
    const owner = key.slice(prefix.length).split(':', 1)[0]
    if (owner && owner !== ownerId) otherOwners.add(owner)
  }
  for (const key of pending.keys()) collect(key)
  const store = storage()
  if (store) try {
    for (let index = 0; index < store.length; index++) collect(store.key(index))
  } catch { /* cache is optional */ }
  for (const otherOwner of otherOwners) clearCachedOwner(otherOwner)
}

export function cachedRead<T>(ownerId: string, resource: string, load: () => Promise<T>, ttlMs = 5 * 60_000): Promise<T> {
  const key = keyFor(ownerId, resource)
  const hit = read<T>(key)
  if (hit !== undefined) return Promise.resolve(hit)
  const inFlight = pending.get(key)
  if (inFlight) return inFlight as Promise<T>
  const ownerVersion = ownerEpoch.get(ownerId) ?? 0
  const resourceVersion = keyEpoch.get(key) ?? 0
  const request = Promise.resolve().then(load).then((value) => {
    if (ownerVersion === (ownerEpoch.get(ownerId) ?? 0) && resourceVersion === (keyEpoch.get(key) ?? 0)) {
      try { storage()?.setItem(key, JSON.stringify({ expiresAt: Date.now() + ttlMs, value })) } catch { /* cache is optional */ }
    }
    return value
  }).finally(() => { if (pending.get(key) === request) pending.delete(key) })
  pending.set(key, request)
  return request
}
