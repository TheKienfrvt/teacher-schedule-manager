import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StudentsPage } from './StudentsPage'
import type { StudentsGateway } from './students-gateway'

describe('StudentsPage', () => {
  it('shows each student with their own rate and history', async () => {
    const gateway: StudentsGateway = {
      list: vi.fn().mockResolvedValue([
        { id: 'an', name: 'An', contact: null, notes: null, rates: [{ id: 'r1', effectiveFrom: '2026-11-01', rateVndPerHour: 100000 }] },
        { id: 'binh', name: 'Bình', contact: null, notes: null, rates: [{ id: 'r2', effectiveFrom: '2026-11-01', rateVndPerHour: 120000 }] },
      ]),
      create: vi.fn(), update: vi.fn(), addRate: vi.fn(),
    }
    render(<StudentsPage gateway={gateway} />)
    expect(await screen.findByText('An')).toBeInTheDocument()
    expect(screen.getByText('Bình')).toBeInTheDocument()
    expect(screen.getAllByText(/100\.000.*₫\/giờ/)).toHaveLength(2)
    expect(screen.getAllByText(/120\.000.*₫\/giờ/)).toHaveLength(2)
  })

  it('rejects a negative rate before writing', async () => {
    const gateway: StudentsGateway = { list: vi.fn().mockResolvedValue([]), create: vi.fn(), update: vi.fn(), addRate: vi.fn() }
    render(<StudentsPage gateway={gateway} />)
    await screen.findByText('Chưa có học sinh nào')
    fireEvent.click(screen.getByRole('button', { name: /Thêm học sinh/ }))
    fireEvent.change(screen.getByLabelText('Tên học sinh'), { target: { value: 'An' } })
    fireEvent.change(screen.getByLabelText('Đơn giá (VND/giờ)'), { target: { value: '-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu học sinh' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Đơn giá phải là số nguyên VND không âm')
    expect(gateway.create).not.toHaveBeenCalled()
  })
})
