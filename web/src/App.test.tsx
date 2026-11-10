import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import type { AuthGateway } from './features/auth/auth-gateway'

function fakeAuth(userId: string | null): AuthGateway {
  return {
    getUserId: vi.fn().mockResolvedValue(userId),
    subscribe: () => () => {},
    signIn: vi.fn().mockResolvedValue(null),
    signOut: vi.fn().mockResolvedValue(undefined),
  }
}

describe('App authentication', () => {
  it('does not reveal cached private pages from an unverified stored session', async () => {
    let resolve!: (value: string | null) => void
    const auth: AuthGateway = {
      getUserId: () => new Promise((done) => { resolve = done }),
      subscribe: (onChange) => { onChange('stale-teacher'); return () => {} },
      signIn: vi.fn(), signOut: vi.fn(),
    }
    render(<App auth={auth} />)
    expect(screen.queryByRole('heading', { name: 'Lịch học' })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Đang kiểm tra đăng nhập')
    resolve(null)
    expect(await screen.findByRole('heading', { name: 'Chào cô trở lại' })).toBeInTheDocument()
  })

  it('hides private navigation until the teacher signs in', async () => {
    render(<App auth={fakeAuth(null)} />)
    expect(await screen.findByRole('heading', { name: 'Chào cô trở lại' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Điều hướng chính' })).not.toBeInTheDocument()
  })

  it('shows the private calendar and signs out', async () => {
    const auth = fakeAuth('teacher-a')
    sessionStorage.setItem('bong:data:v1:teacher-a:students', 'private')
    render(<App auth={auth} />)
    expect(await screen.findByRole('heading', { name: 'Lịch học' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Thêm lịch/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Học sinh' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }))
    expect(await screen.findByRole('heading', { name: 'Chào cô trở lại' })).toBeInTheDocument()
    expect(auth.signOut).toHaveBeenCalledOnce()
    expect(sessionStorage.getItem('bong:data:v1:teacher-a:students')).toBeNull()
  })
})
