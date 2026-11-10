import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  it('shows a useful error when teacher credentials are rejected', async () => {
    render(<LoginPage onSignIn={async () => 'Email hoặc mật khẩu chưa đúng'} />)
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'giaovien@example.com' } })
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'sai-mat-khau' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email hoặc mật khẩu chưa đúng')
    expect(screen.queryByRole('link', { name: 'Đăng ký' })).not.toBeInTheDocument()
  })
})
