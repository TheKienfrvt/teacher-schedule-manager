import { useState, type FormEvent } from 'react'
import { vietnamDateForInstant } from '../../domain/period'
import { createPlannedInterval, formatVietnamTime } from '../sessions/session-time'
import type { AttendanceGateway, AttendanceRecord, AttendanceStatus, FinalizeDraft, MissedAttendance } from './attendance-gateway'

type Student = { id: string, name: string }
type RowDraft = { status: 'completed' | 'absent' | 'cancelled', date: string, time: string, minutes: string,
  overrideRate: string, overrideReason: string, makeupForId: string }
const money = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)}đ`
const statusText: Record<AttendanceStatus, string> = {
  scheduled: 'Dự kiến · 0đ', completed: 'Đã học', absent: 'Nghỉ · 0đ', cancelled: 'Hủy · 0đ',
}

export function AttendancePanel({ sessionId, plannedStartAt, plannedMinutes, students, gateway, onChanged }:
  { sessionId: string, plannedStartAt: string, plannedMinutes: number, students: Student[], gateway: AttendanceGateway, onChanged?: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<AttendanceRecord[]>([])
  const [missed, setMissed] = useState<MissedAttendance[]>([])
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({})
  const [adjusting, setAdjusting] = useState<string | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  async function load() {
    const [attendance, missedRows] = await Promise.all([gateway.listForSession(sessionId), gateway.listMissed()])
    setRows(attendance)
    setMissed(missedRows)
    setLoaded(true)
    setDrafts((current) => {
      const next = { ...current }
      for (const row of attendance) if (!next[row.studentId]) next[row.studentId] = {
        status: 'completed', date: vietnamDateForInstant(plannedStartAt), time: formatVietnamTime(plannedStartAt),
        minutes: String(plannedMinutes), overrideRate: '', overrideReason: '', makeupForId: '',
      }
      return next
    })
  }
  async function toggle() {
    if (open) { setOpen(false); return }
    setOpen(true); setBusy(true); setError(null)
    try { await load() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không tải được thực học') }
    finally { setBusy(false) }
  }
  function change(studentId: string, patch: Partial<RowDraft>) {
    setDrafts((current) => ({ ...current, [studentId]: { ...current[studentId], ...patch } }))
  }
  function applyCommon() {
    const date = vietnamDateForInstant(plannedStartAt)
    const time = formatVietnamTime(plannedStartAt)
    setDrafts((current) => Object.fromEntries(Object.entries(current).map(([id, draft]) =>
      [id, { ...draft, date, time, minutes: String(plannedMinutes) }])))
  }
  async function finalize(studentId: string) {
    const draft = drafts[studentId]
    if (!draft) return
    setBusy(true); setError(null)
    try {
      const completed = draft.status === 'completed'
      const minutes = completed ? Number(draft.minutes) : null
      if (completed && (!Number.isSafeInteger(minutes) || minutes! <= 0)) throw new Error('Số phút thực học phải là số nguyên dương')
      const override = draft.overrideRate.trim() ? Number(draft.overrideRate) : null
      if (override !== null && (!Number.isSafeInteger(override) || override < 0)) throw new Error('Giá riêng phải là số nguyên VND không âm')
      if (override !== null && !draft.overrideReason.trim()) throw new Error('Cần ghi lý do giá riêng')
      const payload: FinalizeDraft = {
        sessionId, studentId, status: draft.status,
        actualStartAt: completed ? createPlannedInterval(draft.date, draft.time, minutes!).startAt : null,
        actualMinutes: minutes, overrideRateVndPerHour: completed ? override : null,
        overrideReason: completed && override !== null ? draft.overrideReason.trim() : null,
        makeupForId: completed ? draft.makeupForId || null : null,
      }
      await gateway.finalize(payload)
      await load()
      await onChanged?.()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không chốt được buổi học') }
    finally { setBusy(false) }
  }
  async function submitAdjustment(event: FormEvent<HTMLFormElement>, row: AttendanceRecord) {
    event.preventDefault()
    const amount = Number(adjustAmount)
    if (!Number.isSafeInteger(amount) || amount === 0) { setError('Khoản điều chỉnh phải là số nguyên VND khác 0'); return }
    if (!adjustReason.trim()) { setError('Cần ghi lý do điều chỉnh'); return }
    setBusy(true); setError(null)
    try {
      await gateway.addAdjustment(row.studentId, row.id, amount, adjustReason.trim())
      setAdjusting(null); setAdjustAmount(''); setAdjustReason('')
      await load(); await onChanged?.()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không lưu được điều chỉnh') }
    finally { setBusy(false) }
  }

  return <div className="attendance-panel">
    <button type="button" onClick={() => void toggle()} aria-expanded={open}>{open ? 'Đóng thực học' : 'Chốt thực học'}</button>
    {open && <div className="attendance-content">
      {error && <p role="alert" className="form-error">{error}</p>}
      {busy && !loaded && <p role="status">Đang tải thực học…</p>}
      {loaded && <>
        {rows.some((row) => row.status === 'scheduled') && students.length > 1 &&
          <button type="button" onClick={applyCommon}>Áp dụng giờ và phút cho cả nhóm</button>}
        {rows.map((row) => {
          const student = students.find((item) => item.id === row.studentId)
          const name = student?.name ?? 'Học sinh đã ẩn'
          const draft = drafts[row.studentId]
          const totalAdjustment = row.adjustments.reduce((sum, item) => sum + item.amountVnd, 0)
          return <fieldset className="attendance-student" aria-label={name} key={row.id}>
            <legend>{name}</legend>
            {row.status === 'scheduled' && draft ? <>
              <label>Trạng thái<select value={draft.status} onChange={(event) => change(row.studentId, { status: event.target.value as RowDraft['status'] })}>
                <option value="completed">Đã học</option><option value="absent">Nghỉ</option><option value="cancelled">Hủy</option>
              </select></label>
              {draft.status === 'completed' && <>
                <div className="form-row"><label>Ngày thực học<input type="date" value={draft.date} onChange={(event) => change(row.studentId, { date: event.target.value })} /></label>
                  <label>Giờ bắt đầu thực học<input type="time" value={draft.time} onChange={(event) => change(row.studentId, { time: event.target.value })} /></label></div>
                <label>Số phút thực học<input type="number" min="1" step="1" value={draft.minutes} onChange={(event) => change(row.studentId, { minutes: event.target.value })} /></label>
                <label>Giá riêng mỗi giờ (nếu có)<input type="number" min="0" step="1" value={draft.overrideRate} onChange={(event) => change(row.studentId, { overrideRate: event.target.value })} /></label>
                {draft.overrideRate !== '' && <label>Lý do giá riêng<input value={draft.overrideReason} onChange={(event) => change(row.studentId, { overrideReason: event.target.value })} /></label>}
                <label>Dạy bù cho buổi nghỉ/hủy<select value={draft.makeupForId} onChange={(event) => change(row.studentId, { makeupForId: event.target.value })}>
                  <option value="">Không phải buổi bù</option>
                  {missed.filter((item) => item.studentId === row.studentId).map((item) =>
                    <option value={item.id} key={item.id}>{vietnamDateForInstant(item.plannedStartAt)}</option>)}
                </select></label>
              </>}
              <button type="button" disabled={busy} onClick={() => void finalize(row.studentId)}>Chốt {name}</button>
            </> : <>
              <p>{statusText[row.status]}{row.status === 'completed' ? ` · ${row.actualMinutes} phút · ${money(row.chargeVnd)}` : ''}</p>
              {row.rateSnapshotVndPerHour !== null && <p>Đơn giá đã chốt: {money(row.rateSnapshotVndPerHour)}/giờ</p>}
              {row.makeupForId && <p>Buổi dạy bù</p>}
              {row.adjustments.length > 0 && <><p>Điều chỉnh: {money(totalAdjustment)} · Tổng: {money(row.chargeVnd + totalAdjustment)}</p>
                <ul>{row.adjustments.map((item) => <li key={item.id}>{money(item.amountVnd)} · {item.reason}</li>)}</ul></>}
              <button type="button" onClick={() => setAdjusting(row.id)}>Điều chỉnh tiền</button>
              {adjusting === row.id && <form onSubmit={(event) => void submitAdjustment(event, row)}>
                <label>Số tiền điều chỉnh (+/− VND)<input type="number" step="1" value={adjustAmount} onChange={(event) => setAdjustAmount(event.target.value)} /></label>
                <label>Lý do điều chỉnh<input value={adjustReason} onChange={(event) => setAdjustReason(event.target.value)} /></label>
                <button type="submit" disabled={busy}>Lưu điều chỉnh</button>
              </form>}
            </>}
          </fieldset>
        })}
      </>}
    </div>}
  </div>
}
