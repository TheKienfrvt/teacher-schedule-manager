# Giai đoạn 1 — Lịch học Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng bản web chạy local để giáo viên đăng nhập, quản lý học sinh/đơn giá và lịch nhóm, sửa/xóa lịch dự kiến, xem ngày/tuần/tháng và nhận cảnh báo trùng giờ.

**Architecture:** React/Vite/TypeScript ở `web/`; Supabase Auth/PostgreSQL ở `supabase/`. Frontend chạy tại máy, backend dùng Supabase local trong giai đoạn phát triển; cùng migration có thể áp dụng lên dự án Supabase sau này. Các thao tác nhiều bảng và audit dùng hàm giao dịch tại database; RLS cô lập từng giáo viên.

**Tech Stack:** React, TypeScript, Vite, Supabase JS, PostgreSQL/Supabase CLI, Vitest, Testing Library.

**Spec:** [PRD](../../../.codex/PRD.md), [kiến trúc](../../../.codex/ARCHITECTURE.md), [thiết kế](../../../.codex/DESIGN.md), [task](../../../.codex/TASKS.md).

## Global Constraints

- Mọi giao diện bằng tiếng Việt, ngày `dd/mm/yyyy`, giờ 24 giờ, múi giờ `Asia/Ho_Chi_Minh`.
- Một buổi có nhiều học sinh; lịch dự kiến không phát sinh học phí; chồng giờ chỉ cảnh báo.
- Chỉ giáo viên có tài khoản; RLS bảo vệ cả đọc và ghi, kể cả khóa ngoại giữa buổi và học sinh.
- Giữ tài liệu điều phối trong `.codex/`, không đưa khóa quản trị hoặc dữ liệu thật vào frontend/repository.
- Trong giai đoạn 1 chỉ dùng dữ liệu thử; không đánh dấu task xong khi chưa quan sát tiêu chí nghiệm thu.

## Review Focus

- Danh sách học sinh trống: không lưu được lịch thiếu học sinh và thông báo rõ cách sửa.
- Hai lịch chỉ chạm đúng điểm kết thúc/bắt đầu: không báo trùng.
- Chọn học sinh thuộc giáo viên khác qua API: database từ chối.
- Lịch đã xóa mềm: không hiện ở lịch thường nhưng còn audit.
- Buổi nhóm có nhiều em: giữ một mục lịch và không tạo tiền khi mới đặt.

---

### Task 1: Khởi tạo ứng dụng và môi trường local (T-01.1)

**Files:** `web/package.json`, `web/index.html`, `web/src/main.tsx`, `web/src/app/App.tsx`, `web/src/shared/styles.css`, `web/.env.example`, `README.md`, `.gitignore`.

**Interfaces:** Tạo ứng dụng tại `web/`, lệnh `npm run dev`, `npm run build`, `npm test`.

- [ ] Tạo Git repository, cấu hình bỏ qua `.env`, build và dữ liệu local.
- [ ] Khởi tạo Vite/React/TypeScript, cài các dependency cần cho giai đoạn 1.
- [ ] Tạo shell giao diện hồng pastel theo `DESIGN.md`, điều hướng Lịch/Học sinh và trạng thái trống.
- [ ] Tạo `.env.example` và README với cách chạy frontend và Supabase local.
- [ ] Chạy build, mở giao diện ở kích thước điện thoại và máy tính; ghi kết quả vào `PROGRESS.md` rồi đánh dấu T-01.1 nếu đạt.

### Task 2: Lược đồ và quyền sở hữu (T-01.2)

**Files:** `supabase/migrations/0001_core.sql`, `supabase/tests/rls.sql`, `supabase/config.toml`.

**Interfaces:** Bảng `profiles`, `students`, `rate_history`, `sessions`, `session_students`, `audit_events`; hàm đặt/sửa/xóa lịch trong giao dịch; mọi hàng gắn chủ sở hữu qua Auth UID.

- [ ] Viết kiểm thử SQL cho A/B: đọc, thêm, sửa, xóa và ghép học sinh vào buổi của người khác phải bị từ chối.
- [ ] Chạy kiểm thử để xác nhận lỗi trước khi có migration.
- [ ] Tạo bảng, khóa ngoại, ràng buộc trạng thái và chính sách RLS; cấm xóa cứng buổi đã chốt.
- [ ] Tạo hàm giao dịch để lưu `sessions` cùng các dòng `session_students` và audit khi sửa/xóa.
- [ ] Chạy migration và kiểm thử RLS trên Supabase local; ghi bằng chứng rồi đánh dấu T-01.2 nếu đạt.

### Task 3: Đăng nhập giáo viên (T-01.3)

**Files:** `web/src/lib/supabase.ts`, `web/src/features/auth/AuthProvider.tsx`, `web/src/features/auth/LoginPage.tsx`, `web/src/features/auth/AuthGuard.tsx`, `web/src/features/auth/auth.test.tsx`.

**Interfaces:** `useAuth()` trả về `{ user, loading, signOut }`; `AuthGuard` chỉ hiển thị nội dung riêng khi có session.

- [ ] Viết test cho trạng thái chưa đăng nhập, đang tải và đăng xuất.
- [ ] Chạy test để xác nhận thất bại trước khi triển khai.
- [ ] Xây trang đăng nhập và bảo vệ route; không có luồng tự đăng ký công khai trong UI.
- [ ] Chạy test, kiểm tra thủ công chưa đăng nhập không thấy dữ liệu và đăng nhập thấy đúng chủ sở hữu; ghi kết quả vào `PROGRESS.md`.

### Task 4: Học sinh và lịch sử giá (T-01.4)

**Files:** `web/src/features/students/StudentsPage.tsx`, `web/src/features/students/StudentForm.tsx`, `web/src/features/students/students.ts`, `web/src/features/students/students.test.tsx`.

**Interfaces:** Tạo/sửa hồ sơ, thêm giá nguyên VND/giờ và ngày hiệu lực; đọc lịch sử giá không sửa ngầm giá cũ.

- [ ] Viết test cho An 100.000đ, Bình 120.000đ, giá âm và ngày hiệu lực trùng.
- [ ] Chạy test để xác nhận thất bại.
- [ ] Xây màn hình học sinh, form và truy vấn; hiện lỗi theo trường.
- [ ] Chạy test, thử với hai tài khoản và ghi kết quả vào `PROGRESS.md`.

### Task 5: Lưu, sửa, xóa lịch nhóm (T-01.5)

**Files:** `web/src/features/sessions/SessionForm.tsx`, `web/src/features/sessions/sessions.ts`, `web/src/features/sessions/session-time.ts`, `web/src/features/sessions/sessions.test.tsx`.

**Interfaces:** `getPlannedEnd(start, minutes)`; các thao tác tạo/sửa/xóa mềm buổi dùng hàm giao dịch; mỗi học sinh có một dòng tham gia `scheduled` với tiền 0đ.

- [ ] Viết test cho 18:00 + 90 phút = 19:30, nhóm An+Bình, thiếu học sinh, xóa mềm và audit.
- [ ] Chạy test để xác nhận thất bại.
- [ ] Xây form với thời lượng nhanh 30/60/90/120 phút hoặc phút tự nhập, hình thức, địa điểm/link và ghi chú.
- [ ] Chạy test và kiểm tra dữ liệu trên Supabase local; ghi kết quả vào `PROGRESS.md`.

### Task 6: Lịch và cảnh báo trùng (T-01.6)

**Files:** `web/src/features/calendar/CalendarPage.tsx`, `web/src/features/calendar/overlap.ts`, `web/src/features/calendar/calendar.test.tsx`.

**Interfaces:** `findOverlaps(candidate, existing)` trả về mục có khoảng thời gian giao nhau; hai khoảng chỉ chạm đầu mút không trùng.

- [ ] Viết test cho 18:30–19:30 trùng 18:00–19:00, trường hợp chạm đầu mút và các mục riêng không bị gộp.
- [ ] Chạy test để xác nhận thất bại.
- [ ] Xây chế độ ngày/tuần/tháng, lọc học sinh, cảnh báo tên/giờ trùng với nút “Vẫn lưu lịch”.
- [ ] Chạy test và thao tác thực tế trên điện thoại/máy tính; ghi kết quả vào `PROGRESS.md`.

### Task 7: Review giai đoạn 1 (T-01.7)

**Files:** `.codex/PROGRESS.md`, `.codex/TASKS.md`.

**Interfaces:** Bằng chứng kiểm tra cuối giai đoạn và danh sách lỗi còn lại.

- [ ] Chạy toàn bộ test, kiểm tra build và migration từ database trống.
- [ ] Thử luồng đăng nhập → học sinh/giá → lịch nhóm → cảnh báo trùng → sửa/xóa trên hai kích thước màn hình.
- [ ] Kiểm tra tài khoản A/B, lịch `scheduled` 0đ và audit xóa mềm.
- [ ] Ghi kết quả, lỗi còn lại; chỉ đánh dấu T-01.7 nếu mọi tiêu chí bắt buộc đã đạt.
