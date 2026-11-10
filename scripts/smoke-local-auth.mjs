import { execSync } from 'node:child_process'
import { randomBytes, randomUUID } from 'node:crypto'

const status = JSON.parse(execSync('npx supabase status -o json', { encoding: 'utf8' }))
const url = new URL(status.API_URL)
if (!['127.0.0.1', 'localhost'].includes(url.hostname)) throw new Error('Chỉ chạy trên Supabase local')

const adminHeaders = { apikey: status.SERVICE_ROLE_KEY, Authorization: `Bearer ${status.SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' }
const anonHeaders = { apikey: status.PUBLISHABLE_KEY, 'Content-Type': 'application/json' }
const ids = []

async function request(path, headers, options = {}) {
  const response = await fetch(new URL(path, url), { ...options, headers: { ...headers, ...options.headers } })
  if (!response.ok) throw new Error(`${options.method ?? 'GET'} ${path}: HTTP ${response.status}`)
  return response.status === 204 ? null : response.json()
}

async function teacher() {
  const email = `smoke-${randomUUID()}@test.local`
  const password = randomBytes(24).toString('base64url')
  const created = await request('/auth/v1/admin/users', adminHeaders, { method: 'POST', body: JSON.stringify({ email, password, email_confirm: true }) })
  ids.push(created.id)
  const login = await request('/auth/v1/token?grant_type=password', anonHeaders, { method: 'POST', body: JSON.stringify({ email, password }) })
  if (login.user.id !== created.id) throw new Error('Sai người dùng sau đăng nhập')
  return { id: created.id, headers: { ...anonHeaders, Authorization: `Bearer ${login.access_token}` } }
}

try {
  const existing = await request('/auth/v1/admin/users?per_page=1000', adminHeaders)
  for (const user of existing.users.filter((item) => item.email?.startsWith('smoke-') && item.email.endsWith('@test.local'))) {
    await request(`/auth/v1/admin/users/${user.id}`, adminHeaders, { method: 'DELETE' })
  }
  const a = await teacher()
  const b = await teacher()
  await request('/rest/v1/rpc/create_student', a.headers, { method: 'POST', body: JSON.stringify({
    p_name: 'An smoke', p_contact: null, p_notes: null, p_effective_from: '2026-11-01', p_rate_vnd_per_hour: 100000,
  }) })
  const aStudents = await request('/rest/v1/students?select=id,name', a.headers)
  const bStudents = await request('/rest/v1/students?select=id,name', b.headers)
  if (aStudents.length !== 1 || aStudents[0].name !== 'An smoke' || bStudents.length !== 0) throw new Error('RLS không cô lập giáo viên A/B')
  const aRates = await request('/rest/v1/rate_history?select=rate_vnd_per_hour', a.headers)
  if (aRates.length !== 1 || Number(aRates[0].rate_vnd_per_hour) !== 100000) throw new Error('Giá ban đầu không khớp')
  const nestedStudents = await request('/rest/v1/students?select=id,name,contact,notes,rate_history(id,effective_from,rate_vnd_per_hour)', a.headers)
  if (nestedStudents.length !== 1 || nestedStudents[0].rate_history.length !== 1) throw new Error('Truy vấn học sinh kèm giá không đúng')
  const second = await request('/rest/v1/rpc/create_student', a.headers, { method: 'POST', body: JSON.stringify({
    p_name: 'Bình smoke', p_contact: null, p_notes: null, p_effective_from: '2026-11-01', p_rate_vnd_per_hour: 120000,
  }) })
  const session = await request('/rest/v1/rpc/create_session', a.headers, { method: 'POST', body: JSON.stringify({
    p_planned_start_at: '2026-11-10T11:00:00Z', p_planned_minutes: 90, p_mode: 'online',
    p_student_ids: [aStudents[0].id, second], p_location: null, p_meeting_url: null, p_notes: 'Nhóm smoke',
  }) })
  const lines = await request(`/rest/v1/session_students?select=student_id,status,charge_vnd&session_id=eq.${session}`, a.headers)
  if (lines.length !== 2 || lines.some((line) => line.status !== 'scheduled' || Number(line.charge_vnd) !== 0)) throw new Error('Lịch nhóm mới không có hai dòng 0đ')
  const windowPath = `/rest/v1/sessions?${new URLSearchParams({
    select: 'id,session_students(student_id,status)',
    planned_start_at: 'lt.2026-11-10T12:00:00Z',
    planned_end_at: 'gt.2026-11-10T11:00:00Z',
  })}`
  const windowSessions = await request(windowPath, a.headers)
  if (windowSessions.length !== 1 || windowSessions[0].session_students.length !== 2) throw new Error('Truy vấn lịch nhóm theo khoảng không đúng')
  const bSessions = await request('/rest/v1/sessions?select=id', b.headers)
  if (bSessions.length !== 0) throw new Error('B đọc được lịch của A')
  let crossOwnerBlocked = false
  try {
    await request('/rest/v1/rpc/update_session', b.headers, { method: 'POST', body: JSON.stringify({
      p_session_id: session, p_planned_start_at: '2026-11-10T12:00:00Z', p_planned_minutes: 90,
      p_mode: 'online', p_student_ids: [aStudents[0].id, second], p_location: null, p_meeting_url: null, p_notes: null,
    }) })
  } catch (error) { crossOwnerBlocked = String(error).includes('HTTP 403') }
  if (!crossOwnerBlocked) throw new Error('B sửa được lịch của A')
  await request('/rest/v1/rpc/update_session', a.headers, { method: 'POST', body: JSON.stringify({
    p_session_id: session, p_planned_start_at: '2026-11-10T12:00:00Z', p_planned_minutes: 90,
    p_mode: 'online', p_student_ids: [aStudents[0].id, second], p_location: null, p_meeting_url: null, p_notes: null,
  }) })
  await request('/rest/v1/rpc/soft_delete_session', a.headers, { method: 'POST', body: JSON.stringify({ p_session_id: session }) })
  const deleted = await request(`/rest/v1/sessions?select=deleted_at&id=eq.${session}`, a.headers)
  const audit = await request(`/rest/v1/audit_events?select=action&entity_id=eq.${session}`, a.headers)
  if (!deleted[0]?.deleted_at || audit.length !== 3) throw new Error('Xóa mềm hoặc audit lịch không đúng')
  console.log('PASS: đăng nhập A/B, RLS, hồ sơ/giá, lịch nhóm 0đ, sửa, xóa mềm và audit.')
} finally {
  const cleanup = await Promise.allSettled(ids.map((id) => request(`/auth/v1/admin/users/${id}`, adminHeaders, { method: 'DELETE' })))
  const failures = cleanup.filter((result) => result.status === 'rejected')
  if (failures.length) throw new Error(`Không dọn được tài khoản thử: ${failures.map((result) => String(result.reason)).join('; ')}`)
}
