import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CalendarPage } from './CalendarPage'
import type { SessionRecord, SessionsGateway } from '../sessions/sessions-gateway'
import type { StudentsGateway } from '../students/students-gateway'
import type { AttendanceGateway } from '../attendance/attendance-gateway'

const students: StudentsGateway = {
  list: vi.fn().mockResolvedValue([
    { id: 'an', name: 'An', contact: null, notes: null, rates: [] },
    { id: 'binh', name: 'Bình', contact: null, notes: null, rates: [] },
  ]), create: vi.fn(), update: vi.fn(), addRate: vi.fn(),
}

describe('CalendarPage', () => {
  it('opens the attendance panel from a scheduled calendar item', async () => {
    const sessions: SessionsGateway = {
      list: vi.fn().mockResolvedValue([{ id: 's1', startAt: '2026-11-10T11:00:00Z', minutes: 90, mode: 'online', location: null, meetingUrl: null, notes: null, studentIds: ['an'], statuses: ['scheduled'] }]),
      create: vi.fn(), update: vi.fn(), softDelete: vi.fn(),
    }
    const attendance: AttendanceGateway = {
      listForSession: vi.fn().mockResolvedValue([{ id: 'row', studentId: 'an', status: 'scheduled', actualStartAt: null, actualMinutes: null,
        rateSnapshotVndPerHour: null, chargeVnd: 0, makeupForId: null, adjustments: [] }]),
      listMissed: vi.fn().mockResolvedValue([]), finalize: vi.fn(), addAdjustment: vi.fn(),
    }
    render(<CalendarPage sessions={sessions} students={students} attendance={attendance} initialDate="2026-11-10" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Chốt thực học' }))
    expect(await screen.findByRole('group', { name: 'An' })).toBeInTheDocument()
  })
  it('keeps the latest calendar window when an older API response arrives late', async () => {
    let resolveWeek!: (items: SessionRecord[]) => void
    let resolveMonth!: (items: SessionRecord[]) => void
    const sessions: SessionsGateway = {
      list: vi.fn((window) => new Promise<SessionRecord[]>((resolve) => {
        if (window.startAt === '2026-11-08T17:00:00.000Z') resolveWeek = resolve
        else resolveMonth = resolve
      })),
      create: vi.fn(), update: vi.fn(), softDelete: vi.fn(),
    }
    render(<CalendarPage sessions={sessions} students={students} initialDate="2026-11-10" />)
    await waitFor(() => expect(resolveWeek).toBeTypeOf('function'))
    fireEvent.click(screen.getByRole('button', { name: 'Tháng' }))
    await waitFor(() => expect(resolveMonth).toBeTypeOf('function'))
    await act(async () => resolveMonth([{ id: 'month', startAt: '2026-11-10T11:00:00Z', minutes: 60,
      mode: 'online', location: null, meetingUrl: null, notes: null, studentIds: ['binh'], statuses: ['scheduled'] }]))
    expect(await screen.findByRole('heading', { name: 'Bình' })).toBeInTheDocument()
    await act(async () => resolveWeek([{ id: 'week', startAt: '2026-11-10T11:00:00Z', minutes: 60,
      mode: 'online', location: null, meetingUrl: null, notes: null, studentIds: ['an'], statuses: ['scheduled'] }]))
    expect(screen.getByRole('heading', { name: 'Bình' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'An' })).not.toBeInTheDocument()
  })

  it('shows one item for a group session', async () => {
    const sessions: SessionsGateway = {
      list: vi.fn().mockResolvedValue([{ id: 's1', startAt: '2026-11-10T11:00:00Z', minutes: 90, mode: 'online', location: null, meetingUrl: null, notes: null, studentIds: ['an', 'binh'], statuses: ['scheduled', 'scheduled'] }]),
      create: vi.fn(), update: vi.fn(), softDelete: vi.fn(),
    }
    render(<CalendarPage sessions={sessions} students={students} initialDate="2026-11-10" />)
    expect(await screen.findByRole('heading', { name: 'An, Bình' })).toBeInTheDocument()
    expect(screen.getByText(/18:00.*19:30/)).toBeInTheDocument()
    expect(screen.getByText('Dự kiến · 0đ · Học nhóm')).toBeInTheDocument()
    expect(sessions.list).toHaveBeenCalledWith({ startAt: '2026-11-08T17:00:00.000Z', endAt: '2026-11-15T17:00:00.000Z' })
    fireEvent.click(screen.getByRole('button', { name: 'Tháng' }))
    await waitFor(() => expect(sessions.list).toHaveBeenCalledWith({ startAt: '2026-10-31T17:00:00.000Z', endAt: '2026-11-30T17:00:00.000Z' }))
  })

  it('marks booked dates in the month and opens the hours and students for one day', async () => {
    const sessions: SessionsGateway = {
      list: vi.fn().mockResolvedValue([
        { id: 'a', startAt: '2026-11-10T11:00:00Z', minutes: 60, mode: 'online', location: null, meetingUrl: 'https://example.com/class', notes: null, studentIds: ['an'], statuses: ['scheduled'] },
        { id: 'b', startAt: '2026-11-10T12:30:00Z', minutes: 60, mode: 'in_person', location: 'Lớp học', meetingUrl: null, notes: null, studentIds: ['binh'], statuses: ['scheduled'] },
        { id: 'c', startAt: '2026-11-12T11:00:00Z', minutes: 90, mode: 'in_person', location: null, meetingUrl: null, notes: null, studentIds: ['an', 'binh'], statuses: ['scheduled', 'scheduled'] },
      ]), create: vi.fn(), update: vi.fn(), softDelete: vi.fn(),
    }
    render(<CalendarPage sessions={sessions} students={students} initialDate="2026-11-10" />)
    await screen.findByRole('heading', { name: 'An' })
    fireEvent.click(screen.getByRole('button', { name: 'Tháng' }))
    const day = await screen.findByRole('button', { name: /10\/11\/2026: 2 buổi; An, Bình/ })
    expect(day).toHaveTextContent('18:00 · An')
    expect(day).toHaveTextContent('19:30 · Bình')
    expect(screen.getByText('18:00–19:00')).toBeInTheDocument()
    expect(screen.getByText('19:30–20:30')).toBeInTheDocument()
    expect(screen.getByText('Link học: https://example.com/class')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /12\/11\/2026: 1 buổi; An, Bình/ }))
    expect(screen.getByRole('heading', { name: 'An, Bình' })).toBeInTheDocument()
    expect(screen.queryByText('19:30–20:30')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tháng sau' }))
    expect(screen.getByText('Tháng 12/2026')).toBeInTheDocument()
    expect(screen.getByText('Ngày này chưa có lịch học.')).toBeInTheDocument()
  })

  it('filters day, week and month views by student', async () => {
    const sessions: SessionsGateway = {
      list: vi.fn().mockResolvedValue([
        { id: 's1', startAt: '2026-11-10T11:00:00Z', minutes: 60, mode: 'online', location: null, meetingUrl: null, notes: null, studentIds: ['an'], statuses: ['scheduled'] },
        { id: 's2', startAt: '2026-11-11T11:00:00Z', minutes: 60, mode: 'online', location: null, meetingUrl: null, notes: null, studentIds: ['binh'], statuses: ['scheduled'] },
      ]),
      create: vi.fn(), update: vi.fn(), softDelete: vi.fn(),
    }
    render(<CalendarPage sessions={sessions} students={students} initialDate="2026-11-10" />)
    expect(await screen.findByRole('heading', { name: 'An' })).toBeInTheDocument()
    expect(sessions.list).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: /11\/11\/2026: 1 buổi; Bình/ }))
    expect(screen.getByRole('heading', { name: 'Bình' })).toBeInTheDocument()
    expect(sessions.list).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: 'Ngày' }))
    expect(screen.getByRole('heading', { name: 'Bình' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tháng' }))
    expect(screen.getByRole('region', { name: 'Các ngày trong tháng' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /10\/11\/2026: 1 buổi; An/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /11\/11\/2026: 1 buổi; Bình/ })).toBeInTheDocument()
    const calls = vi.mocked(sessions.list).mock.calls.length
    fireEvent.change(screen.getByLabelText('Lọc học sinh'), { target: { value: 'binh' } })
    fireEvent.click(screen.getByRole('button', { name: /10\/11\/2026: 0 buổi/ }))
    expect(screen.getByText('Ngày này chưa có lịch học.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /11\/11\/2026: 1 buổi; Bình/ }))
    expect(screen.getByRole('heading', { name: 'Bình' })).toBeInTheDocument()
    expect(sessions.list).toHaveBeenCalledTimes(calls)
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
    expect(screen.getByRole('alert')).toHaveTextContent('An (18:00–19:00)')
    expect(sessions.create).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Vẫn lưu lịch' }))
    expect(sessions.create).toHaveBeenCalledOnce()
  })

  it('saves an online session with a custom duration', async () => {
    const sessions: SessionsGateway = {
      list: vi.fn().mockResolvedValue([]), create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn(), softDelete: vi.fn(),
    }
    render(<CalendarPage sessions={sessions} students={students} initialDate="2026-11-10" />)
    await screen.findByText('Ngày này chưa có lịch học.')
    fireEvent.click(screen.getByRole('button', { name: /Thêm lịch/ }))
    fireEvent.click(screen.getByLabelText('An'))
    fireEvent.change(screen.getByLabelText('Số phút'), { target: { value: 'other' } })
    fireEvent.change(screen.getByLabelText('Nhập số phút'), { target: { value: '45' } })
    fireEvent.change(screen.getByLabelText('Hình thức'), { target: { value: 'online' } })
    fireEvent.change(screen.getByLabelText('Link học'), { target: { value: 'https://example.com/class' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu lịch' }))
    await waitFor(() => expect(sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      minutes: 45, mode: 'online', meetingUrl: 'https://example.com/class', location: null,
    })))
  })

  it('creates, moves and soft-deletes one group calendar item', async () => {
    let items: SessionRecord[] = []
    const sessions: SessionsGateway = {
      list: vi.fn(async () => items),
      create: vi.fn(async (draft) => {
        items = [{ id: 'group', startAt: draft.startAt, minutes: draft.minutes, mode: draft.mode,
          location: draft.location, meetingUrl: draft.meetingUrl, notes: draft.notes,
          studentIds: draft.studentIds, statuses: ['scheduled', 'scheduled'] }]
      }),
      update: vi.fn(async (id, draft) => {
        items = items.map((item) => item.id === id ? { ...item, startAt: draft.startAt, minutes: draft.minutes } : item)
      }),
      softDelete: vi.fn(async () => { items = [] }),
    }
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<CalendarPage sessions={sessions} students={students} initialDate="2026-11-10" />)
    await screen.findByText('Ngày này chưa có lịch học.')
    fireEvent.click(screen.getByRole('button', { name: /Thêm lịch/ }))
    fireEvent.click(screen.getByLabelText('An'))
    fireEvent.click(screen.getByLabelText('Bình'))
    fireEvent.change(screen.getByLabelText('Số phút'), { target: { value: '90' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu lịch' }))
    expect(await screen.findByRole('heading', { name: 'An, Bình' })).toBeInTheDocument()
    expect(screen.getByText(/18:00.*19:30/)).toBeInTheDocument()
    expect(sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      startAt: '2026-11-10T11:00:00.000Z', minutes: 90, studentIds: ['an', 'binh'],
    }))
    fireEvent.click(screen.getByRole('button', { name: 'Sửa' }))
    fireEvent.change(screen.getByLabelText('Giờ bắt đầu'), { target: { value: '19:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu lịch' }))
    await waitFor(() => expect(sessions.update).toHaveBeenCalledWith('group', expect.objectContaining({
      startAt: '2026-11-10T12:00:00.000Z', studentIds: ['an', 'binh'],
    })))
    expect(await screen.findByText(/19:00.*20:30/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xóa' }))
    await waitFor(() => expect(sessions.softDelete).toHaveBeenCalledWith('group'))
    expect(await screen.findByText('Ngày này chưa có lịch học.')).toBeInTheDocument()
  })
})
