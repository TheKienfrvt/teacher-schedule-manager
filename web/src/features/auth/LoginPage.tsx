import { useState, type FormEvent } from 'react'

export type LoginPageProps = { onSignIn: (email: string, password: string) => Promise<string | null> }

export function LoginPage({ onSignIn }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      setError(await onSignIn(email.trim(), password))
    } catch {
      setError('Không thể đăng nhập lúc này. Vui lòng thử lại.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="login-page">
      <form className="content-card login-card" onSubmit={submit}>
        <span className="brand-mark" aria-hidden="true">✿</span>
        <p className="eyebrow">GÓC DẠY HỌC CỦA MÌNH</p>
        <h1>Chào cô trở lại</h1>
        <p className="page-description">Đăng nhập để xem lịch và quản lý học phí.</p>
        <label htmlFor="teacher-email">Email</label>
        <input id="teacher-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <label htmlFor="teacher-password">Mật khẩu</label>
        <input id="teacher-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        {error && <p role="alert" className="form-error">{error}</p>}
        <button type="submit" className="primary-button" disabled={pending}>{pending ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
      </form>
    </main>
  )
}
