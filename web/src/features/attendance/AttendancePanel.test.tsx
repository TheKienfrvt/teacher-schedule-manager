import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { AttendancePanel } from './AttendancePanel'
import type { AttendanceGateway } from './attendance-gateway'

it('applies the group time then lets one student rest and finalizes each row separately', async () => {
  const gateway: AttendanceGateway = {
    listForSession: vi.fn().mockResolvedValue([
      { id: 'row-an', studentId: 'an', status: 'scheduled', actualStartAt: null, actualMinutes: null, rateSnapshotVndPerHour: null, chargeVnd: 0, makeupForId: null, adjustments: [] },
      { id: 'row-binh', studentId: 'binh', status: 'scheduled', actualStartAt: null, actualMinutes: null, rateSnapshotVndPerHour: null, chargeVnd: 0, makeupForId: null, adjustments: [] },
    ]),
    listMissed: vi.fn().mockResolvedValue([]),
    finalize: vi.fn().mockResolvedValue(undefined),
    addAdjustment: vi.fn().mockResolvedValue(undefined),
  }
  render(<AttendancePanel sessionId="session" plannedStartAt="2026-11-10T11:00:00Z" plannedMinutes={90}
    students={[{ id: 'an', name: 'An' }, { id: 'binh', name: 'Bình' }]} gateway={gateway} />)
  fireEvent.click(screen.getByRole('button', { name: 'Chốt thực học' }))
  const an = await screen.findByRole('group', { name: 'An' })
  const binh = screen.getByRole('group', { name: 'Bình' })
  fireEvent.click(screen.getByRole('button', { name: 'Áp dụng giờ và phút cho cả nhóm' }))
  expect(within(an).getByLabelText('Số phút thực học')).toHaveValue(90)
  expect(within(binh).getByLabelText('Số phút thực học')).toHaveValue(90)
  fireEvent.change(within(binh).getByLabelText('Trạng thái'), { target: { value: 'absent' } })
  fireEvent.click(within(an).getByRole('button', { name: 'Chốt An' }))
  await waitFor(() => expect(gateway.finalize).toHaveBeenCalledWith({
    sessionId: 'session', studentId: 'an', status: 'completed', actualStartAt: '2026-11-10T11:00:00.000Z', actualMinutes: 90,
    overrideRateVndPerHour: null, overrideReason: null, makeupForId: null,
  }))
  fireEvent.click(within(binh).getByRole('button', { name: 'Chốt Bình' }))
  await waitFor(() => expect(gateway.finalize).toHaveBeenCalledWith({
    sessionId: 'session', studentId: 'binh', status: 'absent', actualStartAt: null, actualMinutes: null,
    overrideRateVndPerHour: null, overrideReason: null, makeupForId: null,
  }))
})
