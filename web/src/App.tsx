import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LoginPage } from './features/auth/LoginPage'
import { supabaseAuth, type AuthGateway } from './features/auth/auth-gateway'
import { StudentsPage } from './features/students/StudentsPage'
import { CalendarPage } from './features/calendar/CalendarPage'
import { supabaseStudents } from './features/students/students-gateway'
import { supabaseSessions } from './features/sessions/sessions-gateway'
import { clearCachedOwner } from './lib/browser-data-cache'
import { createCachedSessionsGateway, createCachedStudentsGateway } from './lib/cached-gateways'
import './App.css'

type Section = 'calendar' | 'students'

function App({ auth = supabaseAuth }: { auth?: AuthGateway }) {
  const [section, setSection] = useState<Section>('calendar')
  const [userId, setUserId] = useState<string | null | undefined>(undefined)
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const lastUserId = useRef<string | null>(null)
  const verification = useRef(0)
  const students = useMemo(() => userId ? createCachedStudentsGateway(userId, supabaseStudents) : supabaseStudents, [userId])
  const sessions = useMemo(() => userId ? createCachedSessionsGateway(userId, supabaseSessions) : supabaseSessions, [userId])

  const setVerifiedUser = useCallback((id: string | null) => {
    if (lastUserId.current && lastUserId.current !== id) clearCachedOwner(lastUserId.current)
    lastUserId.current = id
    setUserId(id)
  }, [])

  const verifyAuth = useCallback(async () => {
    const attempt = ++verification.current
    try {
      const id = await auth.getUserId()
      if (attempt === verification.current) setVerifiedUser(id)
      return id
    } catch {
      if (attempt === verification.current) setVerifiedUser(null)
      return null
    }
  }, [auth, setVerifiedUser])

  useEffect(() => {
    const unsubscribe = auth.subscribe((claimedId) => {
      if (claimedId === null) { verification.current++; setVerifiedUser(null) }
      else { setUserId(undefined); void verifyAuth() }
    })
    void verifyAuth()
    return () => { verification.current++; unsubscribe() }
  }, [auth, setVerifiedUser, verifyAuth])

  if (userId === undefined) return <main className="login-page" role="status">Đang kiểm tra đăng nhập…</main>
  if (userId === null) return <LoginPage onSignIn={async (email, password) => {
    const error = await auth.signIn(email, password)
    if (error) return error
    return await verifyAuth() ? null : 'Không thể xác minh đăng nhập. Vui lòng thử lại.'
  }} />

  async function signOut() {
    try {
      await auth.signOut()
      verification.current++
      setVerifiedUser(null)
    } catch {
      setSignOutError('Không thể đăng xuất lúc này. Vui lòng thử lại.')
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand" aria-label="Bông — góc dạy học">
          <span className="brand-mark" aria-hidden="true">✿</span>
          <span><strong>Bông</strong><small>Góc dạy học của mình</small></span>
        </div>
        <nav aria-label="Điều hướng chính" className="main-nav">
          <button type="button" className={section === 'calendar' ? 'nav-item active' : 'nav-item'} onClick={() => setSection('calendar')} aria-current={section === 'calendar' ? 'page' : undefined}>Lịch học</button>
          <button type="button" className={section === 'students' ? 'nav-item active' : 'nav-item'} onClick={() => setSection('students')} aria-current={section === 'students' ? 'page' : undefined}>Học sinh</button>
          <button type="button" className="nav-item" disabled>Tổng kết <span className="soon">Sắp có</span></button>
        </nav>
        <div className="sidebar-note">Một chút dịu dàng cho mỗi ngày dạy học <span aria-hidden="true">♡</span></div>
        <button type="button" className="sign-out-button" onClick={() => void signOut()}>Đăng xuất</button>
      </aside>

      <main className="main-content">
        <div className="topline"><span>Không gian dạy học</span><span className="topline-flower" aria-hidden="true">✿</span></div>
        {signOutError && <p role="alert" className="form-error">{signOutError}</p>}
        {section === 'calendar' ? <CalendarPage sessions={sessions} students={students} /> : <StudentsPage gateway={students} />}
      </main>
    </div>
  )
}

export default App
