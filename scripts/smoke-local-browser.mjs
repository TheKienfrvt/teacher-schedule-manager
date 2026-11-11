import { spawn, execSync } from 'node:child_process'
import { randomBytes, randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join, resolve, sep } from 'node:path'

const status = JSON.parse(execSync('npx supabase status -o json', { encoding: 'utf8' }))
const apiUrl = new URL(status.API_URL)
if (!['127.0.0.1', 'localhost'].includes(apiUrl.hostname)) throw new Error('Chỉ chạy với Supabase local')
const appUrl = 'http://127.0.0.1:5173/'
const writeOnMobile = process.argv.includes('--mobile-writes')
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const adminHeaders = { apikey: status.SERVICE_ROLE_KEY, Authorization: `Bearer ${status.SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' }
const anonHeaders = { apikey: status.PUBLISHABLE_KEY, 'Content-Type': 'application/json' }

async function request(path, headers, options = {}) {
  const response = await fetch(new URL(path, apiUrl), { ...options, headers: { ...headers, ...options.headers } })
  if (!response.ok) throw new Error(`${options.method ?? 'GET'} ${path}: HTTP ${response.status}`)
  return response.status === 204 ? null : response.json()
}

async function waitUntil(check, timeoutMs = 15_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const value = await check().catch(() => null)
    if (value) return value
    await new Promise((done) => setTimeout(done, 100))
  }
  throw new Error('Hết thời gian chờ trình duyệt')
}

let browser
let browserDir
let socket
let teacherId
try {
  const email = `browser-${randomUUID()}@test.local`
  const password = randomBytes(24).toString('base64url')
  const teacher = await request('/auth/v1/admin/users', adminHeaders, {
    method: 'POST', body: JSON.stringify({ email, password, email_confirm: true }),
  })
  teacherId = teacher.id
  const login = await request('/auth/v1/token?grant_type=password', anonHeaders, {
    method: 'POST', body: JSON.stringify({ email, password }),
  })
  const userHeaders = { ...anonHeaders, Authorization: `Bearer ${login.access_token}` }
  const an = await request('/rest/v1/rpc/create_student', userHeaders, { method: 'POST', body: JSON.stringify({
    p_name: 'An mẫu', p_contact: null, p_notes: null, p_effective_from: '2026-01-01', p_rate_vnd_per_hour: 100000,
  }) })
  const binh = await request('/rest/v1/rpc/create_student', userHeaders, { method: 'POST', body: JSON.stringify({
    p_name: 'Bình mẫu', p_contact: null, p_notes: null, p_effective_from: '2026-01-01', p_rate_vnd_per_hour: 120000,
  }) })
  await request('/rest/v1/rpc/create_session', userHeaders, { method: 'POST', body: JSON.stringify({
    p_planned_start_at: '2026-11-10T11:00:00Z', p_planned_minutes: 90, p_mode: 'in_person',
    p_student_ids: [an, binh], p_location: 'Lớp học', p_meeting_url: null, p_notes: 'Buổi học mẫu',
  }) })
  await request('/rest/v1/rpc/create_session', userHeaders, { method: 'POST', body: JSON.stringify({
    p_planned_start_at: '2026-11-12T12:00:00Z', p_planned_minutes: 60, p_mode: 'online',
    p_student_ids: [an], p_location: null, p_meeting_url: 'https://example.com/class', p_notes: null,
  }) })

  browserDir = await mkdtemp(join(tmpdir(), 'bong-browser-'))
  browser = spawn(chromePath, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', `--user-data-dir=${browserDir}`, 'about:blank',
  ], { stdio: 'ignore', windowsHide: true })
  const portFile = join(browserDir, 'DevToolsActivePort')
  const port = await waitUntil(async () => Number((await readFile(portFile, 'utf8')).split('\n')[0]))
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
  const page = targets.find((item) => item.type === 'page')
  if (!page?.webSocketDebuggerUrl) throw new Error('Chrome không tạo trang điều khiển')
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
  const waitForText = (selector, value) => waitUntil(() => evaluate(`document.querySelector(${JSON.stringify(selector)})?.textContent?.includes(${JSON.stringify(value)})`))
  const screenshot = async (name, fullPage = false) => {
    const image = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: fullPage })
    const directory = resolve('docs/previews')
    await mkdir(directory, { recursive: true })
    await writeFile(join(directory, name), Buffer.from(image.data, 'base64'))
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: appUrl })
  await waitForText('h1', 'Chào cô trở lại')
  const fill = (selector, value) => evaluate(`(() => {
    const input = document.querySelector(${JSON.stringify(selector)});
    if (!input) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, ${JSON.stringify(value)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`)
  const selectLessonDate = async () => {
    await fill('.calendar-controls input[type=date]', '2026-11-10')
    await waitUntil(() => evaluate('document.querySelector(".day-details h2")?.textContent.includes("10/11/2026")'))
  }
  if (!await fill('input[type="email"]', email) || !await fill('input[type="password"]', password)) throw new Error('Không tìm thấy form đăng nhập')
  await evaluate('document.querySelector("button[type=submit]").click()')
  try {
    await waitForText('h1', 'Lịch học')
  } catch (error) {
    const state = await evaluate('({ heading: document.querySelector("h1")?.textContent, alert: document.querySelector("[role=alert]")?.textContent, emailLength: document.querySelector("input[type=email]")?.value.length, passwordLength: document.querySelector("input[type=password]")?.value.length, button: document.querySelector("button[type=submit]")?.textContent })')
    console.error('Trạng thái đăng nhập:', JSON.stringify(state))
    await screenshot('browser-login-debug.png')
    throw error
  }
  await selectLessonDate()
  await waitUntil(() => evaluate('document.querySelectorAll(".session-card").length === 1'))
  await screenshot('phase1-calendar-desktop.png')
  await evaluate('Array.from(document.querySelectorAll(".view-switch button")).find((item) => item.textContent === "Tháng").click()')
  await waitUntil(() => evaluate('document.querySelector(".calendar-overview.month")?.querySelectorAll(".has-lessons").length === 2'))
  await screenshot('phase1-calendar-month-desktop.png', true)
  await evaluate('Array.from(document.querySelectorAll(".view-switch button")).find((item) => item.textContent === "Tuần").click()')
  await evaluate('Array.from(document.querySelectorAll("nav button")).find((item) => item.textContent.includes("Học sinh")).click()')
  await waitForText('h1', 'Học sinh')
  await waitUntil(() => evaluate('document.querySelectorAll(".student-card").length === 2'))
  await screenshot('phase1-students-desktop.png')
  await evaluate('Array.from(document.querySelectorAll("nav button")).find((item) => item.textContent.includes("Lịch học")).click()')
  await selectLessonDate()
  await waitUntil(() => evaluate('document.querySelectorAll(".session-card").length === 1'))
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await waitUntil(() => evaluate('window.innerWidth === 390'))
  const width = await evaluate('({ viewport: window.innerWidth, document: document.documentElement.scrollWidth })')
  await screenshot('phase1-calendar-mobile.png', true)
  if (width.document > width.viewport + 1) throw new Error(`Giao diện tràn ngang: ${width.document}px > ${width.viewport}px`)
  await evaluate('Array.from(document.querySelectorAll(".view-switch button")).find((item) => item.textContent === "Tháng").click()')
  await waitUntil(() => evaluate('document.querySelector(".calendar-overview.month")?.querySelectorAll(".has-lessons").length === 2'))
  await screenshot('phase1-calendar-month-mobile.png', true)
  await waitUntil(() => evaluate('document.querySelectorAll(".month-agenda button").length === 2'))
  await evaluate('document.querySelectorAll(".month-agenda button")[1].click()')
  await waitForText('.day-details h2', '12/11/2026')
  await waitForText('.day-details .session-card', 'https://example.com/class')
  await evaluate('Array.from(document.querySelectorAll(".calendar-overview.month .calendar-day")).find((item) => item.getAttribute("aria-label")?.includes("10/11/2026"))?.click()')
  await waitForText('.day-details h2', '10/11/2026')
  await evaluate('Array.from(document.querySelectorAll("nav button")).find((item) => item.textContent.includes("Học sinh")).click()')
  await waitUntil(() => evaluate('document.querySelectorAll(".student-card").length === 2'))
  const studentWidth = await evaluate('({ viewport: window.innerWidth, document: document.documentElement.scrollWidth })')
  await screenshot('phase1-students-mobile.png')
  if (studentWidth.document > studentWidth.viewport + 1) throw new Error(`Trang học sinh tràn ngang: ${studentWidth.document}px > ${studentWidth.viewport}px`)

  if (!writeOnMobile) await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await evaluate('Array.from(document.querySelectorAll("button")).find((item) => item.textContent.includes("Thêm học sinh")).click()')
  await waitUntil(() => evaluate('Boolean(document.querySelector("form.edit-card"))'))
  if (writeOnMobile) {
    await screenshot('phase1-student-form-mobile.png')
    await evaluate('window.scrollTo(0, document.documentElement.scrollHeight)')
    const layout = await evaluate('({ submitBottom: document.querySelector("form.edit-card button[type=submit]").getBoundingClientRect().bottom, navTop: document.querySelector(".sidebar").getBoundingClientRect().top })')
    if (layout.submitBottom > layout.navTop - 4) throw new Error('Nút lưu học sinh bị thanh điều hướng mobile che')
  }
  await fill('form.edit-card input:first-of-type', 'Chi mẫu')
  await fill('form.edit-card input[type=number]', '130000')
  await fill('form.edit-card input[type=date]', '2026-11-01')
  await evaluate('document.querySelector("form.edit-card button[type=submit]").click()')
  await waitUntil(() => evaluate('Array.from(document.querySelectorAll(".student-card h2")).some((item) => item.textContent === "Chi mẫu")'))
  await evaluate('Array.from(document.querySelectorAll(".student-card")).find((item) => item.querySelector("h2")?.textContent === "Chi mẫu").querySelector("button").click()')
  await fill('form.edit-card input:first-of-type', 'Chi đã sửa')
  await evaluate('document.querySelector("form.edit-card button[type=submit]").click()')
  await waitUntil(() => evaluate('Array.from(document.querySelectorAll(".student-card h2")).some((item) => item.textContent === "Chi đã sửa")'))
  await evaluate('Array.from(document.querySelectorAll(".student-card")).find((item) => item.querySelector("h2")?.textContent === "Chi đã sửa").querySelectorAll("button")[1].click()')
  await fill('form.edit-card input[type=number]', '140000')
  await fill('form.edit-card input[type=date]', '2099-01-01')
  await evaluate('document.querySelector("form.edit-card button[type=submit]").click()')
  await waitUntil(() => evaluate('!document.querySelector("form.edit-card")'))
  const chi = await evaluate('(() => { const card = Array.from(document.querySelectorAll(".student-card")).find((item) => item.querySelector("h2")?.textContent === "Chi đã sửa"); return { current: card?.querySelector("strong")?.textContent, history: card?.querySelector("details")?.textContent }; })()')
  if (!chi.current.includes('130.000') || !chi.history.includes('140.000')) throw new Error('Giá hiện hành/lịch sử giá của Chi không đúng')

  await evaluate('Array.from(document.querySelectorAll("nav button")).find((item) => item.textContent.includes("Lịch học")).click()')
  await selectLessonDate()
  await waitUntil(() => evaluate('document.querySelectorAll(".session-card").length === 1'))
  await evaluate('Array.from(document.querySelectorAll("button")).find((item) => item.textContent.includes("Thêm lịch")).click()')
  await waitUntil(() => evaluate('Boolean(document.querySelector("form.edit-card"))'))
  if (writeOnMobile) {
    await screenshot('phase1-calendar-form-mobile.png')
    await evaluate('window.scrollTo(0, document.documentElement.scrollHeight)')
    const layout = await evaluate('({ submitBottom: document.querySelector("form.edit-card button[type=submit]").getBoundingClientRect().bottom, navTop: document.querySelector(".sidebar").getBoundingClientRect().top })')
    if (layout.submitBottom > layout.navTop - 4) throw new Error('Nút lưu lịch bị thanh điều hướng mobile che')
  }
  await fill('form.edit-card input[type=date]', '2026-11-10')
  await fill('form.edit-card input[type=time]', '18:30')
  await evaluate('document.querySelectorAll(".student-picker input[type=checkbox]")[0].click()')
  await evaluate('document.querySelectorAll(".student-picker input[type=checkbox]")[1].click()')
  await waitUntil(() => evaluate('document.querySelectorAll(".student-picker input:checked").length === 2'))
  await evaluate('document.querySelector("form.edit-card button[type=submit]").click()')
  await waitUntil(() => evaluate('Boolean(document.querySelector(".overlap-warning"))'))
  if (!await evaluate('document.querySelector(".overlap-warning")?.textContent.includes("18:00–19:30")')) throw new Error('Cảnh báo trùng giờ không hiển thị đúng')
  await evaluate('document.querySelector(".overlap-warning button").click()')
  await waitUntil(() => evaluate('document.querySelectorAll(".session-card").length === 2 && !document.querySelector("form.edit-card")'))
  await evaluate('Array.from(document.querySelectorAll(".session-card")).find((item) => item.querySelector("strong")?.textContent.startsWith("18:30"))?.querySelector("button")?.click()')
  await fill('form.edit-card input[type=time]', '19:00')
  await evaluate('document.querySelector("form.edit-card button[type=submit]").click()')
  await waitUntil(() => evaluate('Boolean(document.querySelector(".overlap-warning"))'))
  await evaluate('document.querySelector(".overlap-warning button").click()')
  await waitUntil(() => evaluate('Array.from(document.querySelectorAll(".session-card strong")).some((item) => item.textContent.startsWith("19:00")) && !document.querySelector("form.edit-card")'))
  await evaluate('window.confirm = () => true')
  await evaluate('Array.from(document.querySelectorAll(".session-card")).find((item) => item.querySelector("strong")?.textContent.startsWith("19:00"))?.querySelectorAll("button")[1]?.click()')
  await waitUntil(() => evaluate('document.querySelectorAll(".session-card").length === 1'))
  const changed = await request('/rest/v1/sessions?select=id,deleted_at,planned_start_at&planned_start_at=eq.2026-11-10T12:00:00Z', userHeaders)
  if (changed.length !== 1 || !changed[0].deleted_at) throw new Error('Lịch sửa không được xóa mềm')
  const audit = await request(`/rest/v1/audit_events?select=action&entity_id=eq.${changed[0].id}`, userHeaders)
  if (audit.length !== 3) throw new Error('Thiếu audit tạo/sửa/xóa lịch')

  await evaluate('document.querySelector(".sign-out-button").click()')
  await waitForText('h1', 'Chào cô trở lại')
  if (await evaluate('Object.keys(sessionStorage).some((key) => key.startsWith("bong:data:"))')) throw new Error('Cache riêng tư còn sau khi đăng xuất')
  console.log(`PASS: đăng nhập; học sinh/giá; lịch nhóm/trùng giờ/sửa/xóa mềm/audit; desktop/mobile 390px; thao tác ghi ${writeOnMobile ? 'mobile' : 'desktop'}; đăng xuất/xóa cache; dọn tài khoản thử.`)
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
    if (target.startsWith(`${base}${sep}`) && basename(target).startsWith('bong-browser-')) await rm(target, { recursive: true, force: true })
  }
  if (teacherId) await request(`/auth/v1/admin/users/${teacherId}`, adminHeaders, { method: 'DELETE' })
}
