import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { createPlannedInterval, formatVietnamTime } from '../sessions/session-time'
import { supabaseSessions, type SessionDraft, type SessionRecord, type SessionsGateway } from '../sessions/sessions-gateway'
import { supabaseStudents, type StudentRecord, type StudentsGateway } from '../students/students-gateway'
import { findOverlaps } from './overlap'

type View = 'day' | 'week' | 'month'
const vietnamDate = (instant: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(instant))
const today = () => vietnamDate(new Date().toISOString())
const labelDate = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString('vi-VN', { timeZone: 'UTC', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
function shift(date: string, days: number) { const value = new Date(`${date}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10) }
function weekStart(date: string) { const day = new Date(`${date}T00:00:00Z`).getUTCDay(); return shift(date, -(day === 0 ? 6 : day - 1)) }
function rangeFor(date: string, view: View) {
  const startDay = view === 'day' ? date : view === 'week' ? weekStart(date) : `${date.slice(0, 7)}-01`
  const endDay = view === 'day' ? shift(date, 1) : view === 'week' ? shift(startDay, 7) : (() => {
    const next = new Date(`${startDay}T00:00:00Z`)
    next.setUTCMonth(next.getUTCMonth() + 1)
    return next.toISOString().slice(0, 10)
  })()
  return { startAt: createPlannedInterval(startDay, '00:00', 1).startAt, endAt: createPlannedInterval(endDay, '00:00', 1).startAt }
}
function visible(date: string, view: View, start: string) {
  if (view === 'day') return start === date
  if (view === 'week') return start >= weekStart(date) && start < shift(weekStart(date), 7)
  return start.slice(0, 7) === date.slice(0, 7)
}

export function CalendarPage({ sessions = supabaseSessions, students = supabaseStudents, initialDate }: { sessions?: SessionsGateway, students?: StudentsGateway, initialDate?: string }) {
  const [items, setItems] = useState<SessionRecord[]>([])
  const [studentList, setStudentList] = useState<StudentRecord[]>([])
  const [date, setDate] = useState(initialDate ?? today())
  const [view, setView] = useState<View>('week')
  const [studentFilter, setStudentFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formDate, setFormDate] = useState(initialDate ?? today())
  const [time, setTime] = useState('18:00')
  const [minutes, setMinutes] = useState('60')
  const [mode, setMode] = useState<'online' | 'in_person'>('in_person')
  const [location, setLocation] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [overlapNames, setOverlapNames] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const visibleWindow = useMemo(() => rangeFor(date, view), [date, view])

  const refresh = useCallback(async () => {
    try {
      const [loadedSessions, loadedStudents] = await Promise.all([sessions.list(visibleWindow), students.list()])
      setItems(loadedSessions); setStudentList(loadedStudents); setError(null)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không tải được lịch học') }
    finally { setLoading(false) }
  }, [sessions, students, visibleWindow])
  useEffect(() => { void refresh() }, [refresh])

  const names = useMemo(() => new Map(studentList.map((student) => [student.id, student.name])), [studentList])
  const shown = items.filter((item) => visible(date, view, vietnamDate(item.startAt)) && (!studentFilter || item.studentIds.includes(studentFilter)))
  const groups = shown.reduce<Record<string, SessionRecord[]>>((result, item) => {
    const key = vietnamDate(item.startAt)
    ;(result[key] ??= []).push(item)
    return result
  }, {})
  const plannedEnd = (() => { try { return formatVietnamTime(createPlannedInterval(formDate, time, Number(minutes)).endAt) } catch { return '—' } })()

  function openNew() {
    setEditingId(null); setFormDate(date); setTime('18:00'); setMinutes('60'); setMode('in_person')
    setLocation(''); setMeetingUrl(''); setNotes(''); setSelectedIds([]); setOverlapNames([]); setError(null); setFormOpen(true)
  }
  function openEdit(item: SessionRecord) {
    setEditingId(item.id); setFormDate(vietnamDate(item.startAt)); setTime(formatVietnamTime(item.startAt)); setMinutes(String(item.minutes))
    setMode(item.mode); setLocation(item.location ?? ''); setMeetingUrl(item.meetingUrl ?? ''); setNotes(item.notes ?? '')
    setSelectedIds(item.studentIds); setOverlapNames([]); setError(null); setFormOpen(true)
  }
  function toggleStudent(id: string) { setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]) }

  function buildDraft(): SessionDraft {
    if (selectedIds.length === 0) throw new Error('Chọn ít nhất một học sinh')
    const duration = Number(minutes)
    if (!Number.isInteger(duration) || duration <= 0) throw new Error('Số phút phải lớn hơn 0')
    const { startAt } = createPlannedInterval(formDate, time, duration)
    return { startAt, minutes: duration, mode, location: location.trim() || null, meetingUrl: meetingUrl.trim() || null, notes: notes.trim() || null, studentIds: selectedIds }
  }
  async function save(force: boolean) {
    try {
      const draft = buildDraft()
      const endAt = new Date(new Date(draft.startAt).getTime() + draft.minutes * 60_000).toISOString()
      const candidates = draft.startAt >= visibleWindow.startAt && endAt <= visibleWindow.endAt
        ? items : await sessions.list({ startAt: draft.startAt, endAt })
      const overlaps = findOverlaps({ id: editingId ?? 'new', startAt: draft.startAt, endAt, studentIds: selectedIds }, candidates.map((item) => ({
        id: item.id, startAt: item.startAt, endAt: new Date(new Date(item.startAt).getTime() + item.minutes * 60_000).toISOString(), studentIds: item.studentIds,
      })))
      if (overlaps.length && !force) {
        setOverlapNames(overlaps.map((item) => `${item.studentIds.map((id) => names.get(id) ?? 'Học sinh').join(', ')} (${formatVietnamTime(item.startAt)}–${formatVietnamTime(item.endAt)})`))
        return
      }
      setBusy(true); setError(null)
      if (editingId) await sessions.update(editingId, draft)
      else await sessions.create(draft)
      setFormOpen(false); setOverlapNames([]); await refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không lưu được lịch học') }
    finally { setBusy(false) }
  }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void save(false) }
  async function remove(item: SessionRecord) {
    if (!window.confirm(`Xóa lịch của ${item.studentIds.map((id) => names.get(id) ?? 'học sinh').join(', ')}?`)) return
    setBusy(true)
    try { await sessions.softDelete(item.id); await refresh() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không xóa được lịch học') }
    finally { setBusy(false) }
  }

  return <>
    <header className="page-header"><div><p className="eyebrow">GÓC LỊCH NHỎ</p><h1>Lịch học</h1><p className="page-description">Ghi lịch cho từng em hoặc một nhóm; lịch dự kiến chưa phát sinh học phí.</p></div><button type="button" className="primary-button" onClick={openNew}>+ Thêm lịch</button></header>
    {error && <p role="alert" className="form-error">{error}</p>}
    {formOpen && <form className="content-card edit-card" onSubmit={submit}>
      <h2>{editingId ? 'Sửa lịch học' : 'Thêm lịch học'}</h2>
      <fieldset className="student-picker"><legend>Học sinh</legend>{studentList.map((student) => <label key={student.id}><input type="checkbox" checked={selectedIds.includes(student.id)} onChange={() => toggleStudent(student.id)} />{student.name}</label>)}{studentList.length === 0 && <p>Hãy thêm học sinh trước khi lên lịch.</p>}</fieldset>
      <div className="form-row"><label>Ngày học<input type="date" required value={formDate} onChange={(event) => setFormDate(event.target.value)} /></label><label>Giờ bắt đầu<input type="time" required value={time} onChange={(event) => setTime(event.target.value)} /></label></div>
      <label>Số phút<select value={['30','60','90','120'].includes(minutes) ? minutes : 'other'} onChange={(event) => setMinutes(event.target.value === 'other' ? '45' : event.target.value)}><option value="30">30 phút</option><option value="60">60 phút</option><option value="90">90 phút</option><option value="120">120 phút</option><option value="other">Số phút khác</option></select></label>
      {!['30','60','90','120'].includes(minutes) && <label>Nhập số phút<input type="number" min="1" step="1" required value={minutes} onChange={(event) => setMinutes(event.target.value)} /></label>}
      <p>Kết thúc dự kiến: <strong>{plannedEnd}</strong></p>
      <label>Hình thức<select value={mode} onChange={(event) => setMode(event.target.value as 'online' | 'in_person')}><option value="in_person">Trực tiếp</option><option value="online">Online</option></select></label>
      {mode === 'in_person' ? <label>Địa điểm<input value={location} onChange={(event) => setLocation(event.target.value)} /></label> : <label>Link học<input type="url" value={meetingUrl} onChange={(event) => setMeetingUrl(event.target.value)} /></label>}
      <label>Ghi chú<textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      {overlapNames.length > 0 && <div role="alert" className="overlap-warning"><strong>Trùng giờ với:</strong><ul>{overlapNames.map((name) => <li key={name}>{name}</li>)}</ul><button type="button" onClick={() => void save(true)} disabled={busy}>Vẫn lưu lịch</button></div>}
      <div className="form-actions"><button type="button" onClick={() => setFormOpen(false)}>Hủy</button><button type="submit" className="primary-button" disabled={busy || studentList.length === 0}>Lưu lịch</button></div>
    </form>}
    <div className="calendar-controls"><div className="view-switch" role="group" aria-label="Chế độ xem">{(['day','week','month'] as View[]).map((item) => <button type="button" className={view === item ? 'selected' : ''} key={item} onClick={() => setView(item)}>{item === 'day' ? 'Ngày' : item === 'week' ? 'Tuần' : 'Tháng'}</button>)}</div><label>Ngày xem<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label>Lọc học sinh<select value={studentFilter} onChange={(event) => setStudentFilter(event.target.value)}><option value="">Tất cả</option>{studentList.map((student) => <option value={student.id} key={student.id}>{student.name}</option>)}</select></label></div>
    {loading ? <p role="status">Đang tải lịch…</p> : shown.length === 0 ? <section className="content-card empty-state"><div className="empty-illustration" aria-hidden="true">✿</div><h2>Chưa có lịch học nào</h2><p>Chọn “Thêm lịch” để ghi buổi học đầu tiên.</p></section> : <div className="calendar-groups">{Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([groupDate, dayItems]) => <section key={groupDate}><h2>{labelDate(groupDate)}</h2><div className="session-list">{dayItems?.map((item) => <article className="content-card session-card" key={item.id}><div><strong>{formatVietnamTime(item.startAt)}–{formatVietnamTime(new Date(new Date(item.startAt).getTime() + item.minutes * 60_000).toISOString())}</strong><h3>{item.studentIds.map((id) => names.get(id) ?? 'Học sinh đã ẩn').join(', ')}</h3><p>{item.mode === 'online' ? 'Online' : 'Trực tiếp'} · {item.minutes} phút{item.location ? ` · ${item.location}` : ''}</p>{item.notes && <p>{item.notes}</p>}</div>{item.statuses.every((status) => status === 'scheduled') && <div className="student-actions"><button type="button" onClick={() => openEdit(item)}>Sửa</button><button type="button" disabled={busy} onClick={() => void remove(item)}>Xóa</button></div>}</article>)}</div></section>)}</div>}
  </>
}
