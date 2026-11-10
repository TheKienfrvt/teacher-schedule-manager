import { useEffect, useState, type FormEvent } from 'react'
import { validateStudentDraft } from './student-form'
import { supabaseStudents, type StudentRecord, type StudentsGateway } from './students-gateway'

function todayInVietnam() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}
const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })

export function StudentsPage({ gateway = supabaseStudents }: { gateway?: StudentsGateway }) {
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<'new' | string | null>(null)
  const [rateFor, setRateFor] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [notes, setNotes] = useState('')
  const [rate, setRate] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState(todayInVietnam())
  const [busy, setBusy] = useState(false)

  async function refresh() {
    try { setStudents(await gateway.list()); setError(null) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không tải được học sinh') }
    finally { setLoading(false) }
  }
  useEffect(() => { void refresh() }, [gateway])

  function startNew() {
    setForm('new'); setRateFor(null); setName(''); setContact(''); setNotes(''); setRate(''); setEffectiveFrom(todayInVietnam()); setError(null)
  }
  function startEdit(student: StudentRecord) {
    setForm(student.id); setRateFor(null); setName(student.name); setContact(student.contact ?? ''); setNotes(student.notes ?? ''); setError(null)
  }
  function startRate(student: StudentRecord) {
    setForm(null); setRateFor(student.id); setRate(''); setEffectiveFrom(todayInVietnam()); setError(null)
  }

  async function saveStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (form === null) return
    const draft = { name, rateVndPerHour: Number(rate), effectiveFrom }
    const issue = form === 'new' ? validateStudentDraft(draft) : (!name.trim() ? 'Nhập tên học sinh' : null)
    if (issue) { setError(issue); return }
    setBusy(true); setError(null)
    try {
      if (form === 'new') await gateway.create({ ...draft, contact, notes })
      else await gateway.update(form, { name, contact, notes })
      setForm(null); await refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không lưu được học sinh') }
    finally { setBusy(false) }
  }

  async function saveRate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!rateFor) return
    const issue = validateStudentDraft({ name: 'Học sinh', rateVndPerHour: Number(rate), effectiveFrom })
    if (issue) { setError(issue); return }
    setBusy(true); setError(null)
    try { await gateway.addRate(rateFor, effectiveFrom, Number(rate)); setRateFor(null); await refresh() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không lưu được đơn giá') }
    finally { setBusy(false) }
  }

  return <>
    <header className="page-header"><div><p className="eyebrow">DANH SÁCH CỦA MÌNH</p><h1>Học sinh</h1><p className="page-description">Quản lý hồ sơ và lịch sử đơn giá riêng cho từng em.</p></div><button type="button" className="primary-button" onClick={startNew}>+ Thêm học sinh</button></header>
    {error && <p role="alert" className="form-error">{error}</p>}
    {form && <form className="content-card edit-card" onSubmit={(event) => void saveStudent(event)}>
      <h2>{form === 'new' ? 'Thêm học sinh' : 'Sửa hồ sơ'}</h2>
      <label>Tên học sinh<input required value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label>Liên hệ phụ huynh<input value={contact} onChange={(event) => setContact(event.target.value)} /></label>
      <label>Ghi chú<textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      {form === 'new' && <><label>Đơn giá (VND/giờ)<input type="number" step="1" required value={rate} onChange={(event) => setRate(event.target.value)} /></label><label>Ngày hiệu lực<input type="date" required value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} /></label></>}
      <div className="form-actions"><button type="button" onClick={() => setForm(null)}>Hủy</button><button className="primary-button" disabled={busy} type="submit">Lưu học sinh</button></div>
    </form>}
    {rateFor && <form className="content-card edit-card" onSubmit={(event) => void saveRate(event)}>
      <h2>Thêm đơn giá mới</h2>
      <label>Đơn giá (VND/giờ)<input type="number" step="1" required value={rate} onChange={(event) => setRate(event.target.value)} /></label>
      <label>Ngày hiệu lực<input type="date" required value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} /></label>
      <div className="form-actions"><button type="button" onClick={() => setRateFor(null)}>Hủy</button><button className="primary-button" disabled={busy} type="submit">Lưu đơn giá</button></div>
    </form>}
    {loading ? <p role="status">Đang tải học sinh…</p> : students.length === 0 ? <section className="content-card empty-state"><div className="empty-illustration" aria-hidden="true">♡</div><h2>Chưa có học sinh nào</h2><p>Thêm học sinh đầu tiên để bắt đầu lên lịch.</p></section> : <div className="student-grid">{students.map((student) => <article className="content-card student-card" key={student.id}>
      <h2>{student.name}</h2><p>{student.contact || 'Chưa có liên hệ'}</p>
      <strong>{student.rates[0] ? money.format(student.rates[0].rateVndPerHour) : 'Chưa có giá'}/giờ</strong>
      <div className="student-actions"><button type="button" onClick={() => startEdit(student)}>Sửa hồ sơ</button><button type="button" onClick={() => startRate(student)}>Thêm giá</button></div>
      <details><summary>Lịch sử đơn giá</summary><ul>{student.rates.map((item) => <li key={item.id}>{new Date(`${item.effectiveFrom}T00:00:00Z`).toLocaleDateString('vi-VN', { timeZone: 'UTC' })}: {money.format(item.rateVndPerHour)}/giờ</li>)}</ul></details>
    </article>)}</div>}
  </>
}
