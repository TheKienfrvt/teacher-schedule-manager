import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CalendarPage } from './CalendarPage'
import type { SessionsGateway } from '../sessions/sessions-gateway'
import type { StudentsGateway } from '../students/students-gateway'

const students: StudentsGateway = {
  list: vi.fn().mockResolvedValue([
    { id: 'an', name: 'An', contact: null, notes: null, rates: [] },
    { id: 'binh', name: 'Bình', contact: null, notes: null, rates: [] },
  ]), create: vi.fn(), update: vi.fn(), addRate: vi.fn(),
}

describe('CalendarPage', () => {
  it('shows one item for a group session', async () => {
    const sessions: SessionsGateway = {
      list: vi.fn().mockResolvedValue([{ id: 's1', startAt: '2026-11-10T11:00:00Z', minutes: 90, mode: 'online', location: null, meetingUrl: null, notes: null, studentIds: ['an', 'binh'], statuses: ['scheduled', 'scheduled'] }]),
      create: vi.fn(), update: vi.fn(), softDelete: vi.fn(),
    }
    render(<CalendarPage sessions={sessions} students={students} initialDate="2026-11-10" />)
    expect(await screen.findByText('An, Bình')).toBeInTheDocument()
    expect(screen.getByText(/18:00.*19:30/)).toBeInTheDocument()
    expect(sessions.list).toHaveBeenCalledWith({ startAt: '2026-11-08T17:00:00.000Z', endAt: '2026-11-15T17:00:00.000Z' })
    fireEvent.click(screen.getByRole('button', { name: 'Tháng' }))
    expect(sessions.list).toHaveBeenCalledWith({ startAt: '2026-10-31T17:00:00.000Z', endAt: '2026-11-30T17:00:00.000Z' })
  })

  it('warns on overlap and still lets the teacher save', async () => {
    const sessions: SessionsGateway = {
      list: vi.fn().mockResolvedValue([{ id: 's1', startAt: '2026-11-10T11:00:00Z', minutes: 60, mode: 'online', location: null, meetingUrl: null, notes: null, studentIds: ['an'], statuses: ['scheduled'] }]),
      create: vi.fn().mockResolvedValue(undefined), update: vi.fn(), softDelete: vi.fn(),
    }
    render(<CalendarPage sessions={sessions} students={students} initialDate="2026-11-10" />)
    await screen.findByRole('heading', { name: 'An' })
    fireEvent.click(screen.getByRole('button', { name: /Thêm lịch/ }))
    fireEvent.click(screen.getByLabelText('Bình'))
    fireEvent.change(screen.getByLabelText('Giờ bắt đầu'), { target: { value: '18:30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu lịch' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Trùng giờ')
    expect(sessions.create).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Vẫn lưu lịch' }))
    expect(sessions.create).toHaveBeenCalledOnce()
  })
})
