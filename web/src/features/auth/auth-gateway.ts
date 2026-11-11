import { getSupabase } from '../../lib/supabase'

export type AuthGateway = {
  getUserId: () => Promise<string | null>
  subscribe: (onChange: (userId: string | null) => void) => () => void
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

export const supabaseAuth: AuthGateway = {
  async getUserId() {
    const client = getSupabase()
    if (!client) return null
    const { data, error } = await client.auth.getUser()
    return error ? null : data.user?.id ?? null
  },
  subscribe(onChange) {
    const client = getSupabase()
    if (!client) return () => {}
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return
      const id = session?.user.id ?? null
      const timer = setTimeout(() => {
        timers.delete(timer)
        onChange(id)
      }, 0)
      timers.add(timer)
    })
    return () => {
      for (const timer of timers) clearTimeout(timer)
      data.subscription.unsubscribe()
    }
  },
  async signIn(email, password) {
    const client = getSupabase()
    if (!client) return 'Chưa cấu hình Supabase. Xem web/.env.example.'
    const { error } = await client.auth.signInWithPassword({ email, password })
    return error ? 'Email hoặc mật khẩu chưa đúng' : null
  },
  async signOut() {
    const client = getSupabase()
    if (!client) return
    const { error } = await client.auth.signOut()
    if (error) throw error
  },
}
