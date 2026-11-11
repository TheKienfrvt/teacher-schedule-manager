import { spawn, execSync } from 'node:child_process'
import { randomBytes, randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join, resolve, sep } from 'node:path'

const status = JSON.parse(execSync('npx supabase status -o json', { encoding: 'utf8' }))
const apiUrl = new URL(status.API_URL)
if (!['127.0.0.1', 'localhost'].includes(apiUrl.hostname)) throw new Error('Chỉ chạy với Supabase local')
const adminHeaders = { apikey: status.SERVICE_ROLE_KEY, Authorization: `Bearer ${status.SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' }
const anonHeaders = { apikey: status.PUBLISHABLE_KEY, 'Content-Type': 'application/json' }
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
async function request(path, headers, options = {}) {
  const response = await fetch(new URL(path, apiUrl), { ...options, headers: { ...headers, ...options.headers } })
  if (!response.ok) throw new Error(`${options.method ?? 'GET'} ${path}: HTTP ${response.status} ${await response.text()}`)
  return response.status === 204 ? null : response.json()
}
async function waitUntil(check, timeoutMs = 15_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const result = await check().catch(() => null)
    if (result) return result
    await new Promise((done) => setTimeout(done, 100))
  }
  throw new Error('Hết thời gian chờ giao diện')
}

let browser
let browserDir
let socket
let teacherId
try {
  const email = `phase2-${randomUUID()}@test.local`
  const password = randomBytes(24).toString('base64url')
  const teacher = await request('/auth/v1/admin/users', adminHeaders,
    { method: 'POST', body: JSON.stringify({ email, password, email_confirm: true }) })
  teacherId = teacher.id
  const login = await request('/auth/v1/token?grant_type=password', anonHeaders,
    { method: 'POST', body: JSON.stringify({ email, password }) })
  const userHeaders = { ...anonHeaders, Authorization: `Bearer ${login.access_token}` }
  const student = async (name, rate) => request('/rest/v1/rpc/create_student', userHeaders, {
    method: 'POST', body: JSON.stringify({ p_name: name, p_contact: null, p_notes: null,
      p_effective_from: '2026-01-01', p_rate_vnd_per_hour: rate }),
  })
  const an = await student('An phase 2', 100000)
  const binh = await student('Bình phase 2', 120000)
  const session = async (startAt, studentIds, minutes) => request('/rest/v1/rpc/create_session', userHeaders, {
    method: 'POST', body: JSON.stringify({ p_planned_start_at: startAt, p_planned_minutes: minutes,
      p_mode: 'online', p_student_ids: studentIds, p_location: null, p_meeting_url: null, p_notes: null }),
  })
  const group = await session('2026-11-10T11:00:00Z', [an, binh], 90)
  const makeup = await session('2026-11-12T11:00:00Z', [an], 60)

  browserDir = await mkdtemp(join(tmpdir(), 'bong-phase2-'))
  browser = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${browserDir}`, 'about:blank'],
  { stdio: 'ignore', windowsHide: true })
  const port = await waitUntil(async () => Number((await readFile(join(browserDir, 'DevToolsActivePort'), 'utf8')).split('\n')[0]))
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
  const page = targets.find((item) => item.type === 'page')
  socket = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((done, fail) => { socket.addEventListener('open', done, { once: true }); socket.addEventListener('error', fail, { once: true }) })
  let sequence = 0
  const pending = new Map()
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (!message.id || !pending.has(message.id)) return
    const { done, fail } = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) fail(new Error(message.error.message))
    else done(message.result)
  })
  const send = (method, params = {}) => new Promise((done, fail) => {
    const id = ++sequence
    pending.set(id, { done, fail })
    socket.send(JSON.stringify({ id, method, params }))
  })
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) throw new Error('JavaScript lỗi trong trình duyệt')
    return result.result.value
  }
  const fill = (selector, value) => evaluate(`(() => {
    const input = document.querySelector(${JSON.stringify(selector)});
    if (!input) return false;
    const proto = input instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(input, ${JSON.stringify(value)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`)
  const selectDay = async (date) => {
    if (!await fill('.calendar-controls input[type=date]', date)) throw new Error('Không tìm thấy ngày xem')
    await waitUntil(() => evaluate(`document.querySelector('.day-details h2')?.textContent.includes(${JSON.stringify(date.slice(8, 10) + '/' + date.slice(5, 7))})`))
  }
  const clickButton = (selector, text) => evaluate(`(() => {
    const button = Array.from(document.querySelectorAll(${JSON.stringify(selector)})).find((item) => item.textContent?.trim() === ${JSON.stringify(text)});
    button?.click(); return Boolean(button);
  })()`)

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/' })
  await waitUntil(() => evaluate('Boolean(document.querySelector("input[type=email]"))'))
  await fill('input[type=email]', email)
  await fill('input[type=password]', password)
  await evaluate('document.querySelector("button[type=submit]").click()')
  await waitUntil(() => evaluate('document.querySelector("h1")?.textContent === "Lịch học"'))
  await selectDay('2026-11-10')
  await waitUntil(() => evaluate('document.querySelectorAll(".session-card").length === 1'))
  if (!await clickButton('.attendance-panel button', 'Chốt thực học')) throw new Error('Không mở được form thực học')
  await waitUntil(() => evaluate('document.querySelectorAll(".attendance-student").length === 2'))
  await clickButton('.attendance-content button', 'Áp dụng giờ và phút cho cả nhóm')
  await fill('.attendance-student:nth-of-type(2) select', 'absent')
  await clickButton('.attendance-student button', 'Chốt An phase 2')
  await waitUntil(() => evaluate('document.querySelector(".attendance-student")?.textContent.includes("150.000đ")'))
  await clickButton('.attendance-student button', 'Chốt Bình phase 2')
  await waitUntil(() => evaluate('document.querySelectorAll(".attendance-student")[1]?.textContent.includes("Nghỉ · 0đ")'))
  const groupRows = await request(`/rest/v1/session_students?select=id,student_id,status,charge_vnd,rate_snapshot_vnd_per_hour&session_id=eq.${group}`, userHeaders)
  const anRow = groupRows.find((item) => item.student_id === an)
  const binhRow = groupRows.find((item) => item.student_id === binh)
  if (Number(anRow.charge_vnd) !== 150000 || Number(anRow.rate_snapshot_vnd_per_hour) !== 100000 ||
      binhRow.status !== 'absent' || Number(binhRow.charge_vnd) !== 0) throw new Error('Tiền nhóm không khớp từng em')

  await selectDay('2026-11-12')
  await waitUntil(() => evaluate('document.querySelector(".session-card h3")?.textContent === "An phase 2"'))
  await clickButton('.attendance-panel button', 'Chốt thực học')
  await waitUntil(() => evaluate('document.querySelectorAll(".attendance-student").length === 1'))
  await fill('.attendance-student label:last-of-type select', anRow.id)
  await clickButton('.attendance-student button', 'Chốt An phase 2')
  await waitUntil(() => evaluate('document.querySelector(".attendance-student")?.textContent.includes("Buổi dạy bù")'))
  const makeupRows = await request(`/rest/v1/session_students?select=makeup_for_id,charge_vnd&session_id=eq.${makeup}`, userHeaders)
  if (makeupRows.length !== 1 || makeupRows[0].makeup_for_id !== anRow.id || Number(makeupRows[0].charge_vnd) !== 100000)
    throw new Error('Liên kết hoặc tiền dạy bù không đúng')

  await selectDay('2026-11-10')
  await waitUntil(() => evaluate('document.querySelector(".session-card h3")?.textContent === "An phase 2, Bình phase 2"'))
  await clickButton('.attendance-panel button', 'Chốt thực học')
  await waitUntil(() => evaluate('document.querySelectorAll(".attendance-student").length === 2'))
  await clickButton('.attendance-student button', 'Điều chỉnh tiền')
  await fill('.attendance-student form input[type=number]', '-10000')
  await fill('.attendance-student form input:not([type=number])', 'Sửa sau chốt')
  await clickButton('.attendance-student form button', 'Lưu điều chỉnh')
  await waitUntil(() => evaluate('document.querySelector(".attendance-student")?.textContent.includes("Tổng: 140.000đ")'))
  const adjustments = await request(`/rest/v1/fee_adjustments?select=amount_vnd,reason,period_month&session_student_id=eq.${anRow.id}`, userHeaders)
  if (adjustments.length !== 1 || Number(adjustments[0].amount_vnd) !== -10000 || adjustments[0].period_month !== '2026-11-01')
    throw new Error('Điều chỉnh sau chốt không đúng')

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await waitUntil(() => evaluate('window.innerWidth === 390'))
  const width = await evaluate('({ viewport: window.innerWidth, content: document.documentElement.scrollWidth })')
  if (width.content > width.viewport + 1) throw new Error(`Form thực học tràn ngang: ${width.content}px`)
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
  const directory = resolve('docs/previews')
  await mkdir(directory, { recursive: true })
  await writeFile(join(directory, 'phase2-attendance-mobile.png'), Buffer.from(shot.data, 'base64'))
  await evaluate('document.querySelector(".sign-out-button").click()')
  await waitUntil(() => evaluate('Boolean(document.querySelector("input[type=email]"))'))
  console.log('PASS: chốt An/Bình riêng, học bù đúng em, điều chỉnh có lý do, tiền và snapshot, mobile 390px, đăng xuất và dọn tài khoản thử.')
} finally {
  socket?.close()
  if (browser) {
    browser.kill()
    if (browser.exitCode === null) await Promise.race([
      new Promise((done) => browser.once('exit', done)),
      new Promise((done) => setTimeout(done, 5000)),
    ])
  }
  if (browserDir) {
    const base = await realpath(tmpdir())
    const target = await realpath(browserDir)
    if (target.startsWith(`${base}${sep}`) && basename(target).startsWith('bong-phase2-')) await rm(target, { recursive: true, force: true })
  }
  if (teacherId) await request(`/auth/v1/admin/users/${teacherId}`, adminHeaders, { method: 'DELETE' })
}
