# Các phiên triển khai giai đoạn 1–4 — Implementation Plan (đã duyệt 10/11/2026)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` để triển khai từng phiên sau khi người dùng duyệt. Các bước `- [ ]` trong tài liệu này là kế hoạch, chưa phải việc đã làm.

**Goal:** Hoàn thiện ứng dụng lịch dạy và học phí qua bốn giai đoạn có thể nghiệm thu riêng, từ bản lịch local đến báo cáo XLSX/PDF và khôi phục dữ liệu thử.

**Architecture:** Giữ React/Vite/TypeScript ở `web/`, Supabase Auth/PostgreSQL và RLS ở `supabase/`. Lịch dự kiến tách khỏi dòng thực học và thanh toán; RPC xử lý thay đổi nhiều bảng cùng audit, còn một mô hình bảng kê dùng chung cho màn hình và file xuất.

**Tech Stack:** React, TypeScript, Vite, Supabase CLI/PostgreSQL, Vitest/Testing Library; chọn thư viện XLSX/PDF và font Unicode khi bắt đầu phiên xuất file.

**Spec:** [PRD](../../../.codex/PRD.md), [kiến trúc](../../../.codex/ARCHITECTURE.md), [thiết kế](../../../.codex/DESIGN.md), [quy tắc](../../../.codex/RULES.md), [quyết định đã duyệt](../../decisions.md), [TASKS](../../../.codex/TASKS.md), [tiến độ](../../../.codex/PROGRESS.md).

## Trạng thái và quyền bắt đầu

- Người dùng đã đồng ý bắt đầu triển khai ngày 10/11/2026. Các cổng duyệt sau mỗi phase vẫn áp dụng.
- Đang có 1/20 task của giai đoạn 1–4 được nghiệm thu: `T-01.2`. Mã Auth, học sinh, lịch và hàm tính tiền đã có một phần; không làm lại từ đầu và không coi test đơn vị là nghiệm thu toàn luồng.
- Sau khi người dùng đồng ý, bắt đầu **Phiên 1.1**. Cuối mỗi phase, gửi kết quả, lỗi còn lại và chờ người dùng đồng ý phase tiếp theo. Không tự chuyển phase. Giai đoạn 5 (phát hành) không nằm trong kế hoạch này.
- Hai kế hoạch ngày 09/11/2026 vẫn là tài liệu tham khảo kỹ thuật; **tài liệu này quyết định thứ tự phiên và điểm dừng** sau khi được duyệt.
- Chỉ đánh dấu `[x]` trong `TASKS.md` khi đạt tiêu chí của task và có bằng chứng trong `PROGRESS.md`. Nếu test bị công cụ chặn, ghi rõ là *chưa kiểm chứng*.

## Global Constraints

- Chỉ giáo viên đăng nhập. Tài khoản A không đọc hoặc ghi dữ liệu B; service role key không xuất hiện trong frontend, repository, log hay ảnh chụp.
- Mục `scheduled` luôn 0đ. Một buổi có nhiều em, nhưng thời gian thực học, giá và tiền của từng em độc lập.
- Chồng giờ chỉ cảnh báo và vẫn cho lưu. Xóa lịch dự kiến là xóa mềm có audit; không xóa cứng dữ liệu đã tính tiền.
- Tiền và phút là số nguyên. Tính từng dòng: `floor((rate_vnd_per_hour × actual_minutes + 30) / 60)`; giá chốt là snapshot của giá có hiệu lực tại giờ bắt đầu thực học của em, trừ giá riêng có lý do.
- Tháng xác định từ giờ bắt đầu **thực tế của từng em** theo `Asia/Ho_Chi_Minh`; ngày hiển thị `dd/mm/yyyy`, giờ 24 giờ, giao diện tiếng Việt và hồng pastel dễ đọc.
- Không tự thu phí nghỉ sát giờ; phí đặc biệt là điều chỉnh có lý do. Bản đầu không nhận tiền ứng trước hoặc vượt tổng phải thu của kỳ.
- Dùng dữ liệu thử local cho toàn bộ giai đoạn 1–4. Trước khi dùng dữ liệu thật phải có bản sao lưu và kiểm tra khôi phục.

## Cách chia phiên và điểm dừng

Mỗi phiên kết thúc bằng: thay đổi có thể xem, test rủi ro đã chạy, kết quả ghi vào `PROGRESS.md`, lỗi còn lại, và đề xuất trạng thái task liên quan. Một phiên có thể kết thúc với task gốc vẫn `[ ]` nếu chưa đạt toàn bộ tiêu chí. **Không chuyển phase chỉ vì các file đã được tạo.**

**Phương án đã cân nhắc:** Làm liên tục giai đoạn 1–4 tiết kiệm các lần bàn giao nhưng khó kiểm tra giữa chừng; duyệt từng task gốc lại có quá nhiều điểm dừng. Kế hoạch chọn **phiên theo lát cắt có thể thử, duyệt theo phase** vì người dùng muốn đọc và đồng ý trước khi xây tiếp.

| Phase | Phiên | Task gốc | Bàn giao có thể kiểm tra | Cổng sang phase sau |
|---|---|---|---|---|
| 1 — Lịch local | 1.1 Sửa nền dữ liệu | T-01.1, T-01.2 | Dọn được tài khoản thử có lịch; migration dựng lại từ trống; test RLS và smoke API sạch |  |
| 1 | 1.2 Auth và học sinh | T-01.3, T-01.4 | Đăng nhập A/B, sửa hồ sơ/thêm giá, giá đang hiệu lực, lịch sử giá |  |
| 1 | 1.3 Lịch nhóm | T-01.5, T-01.6 | Tạo/sửa/xóa mềm, ngày/tuần/tháng, lọc, cảnh báo trùng vẫn lưu |  |
| 1 | 1.4 Review | T-01.1–01.7 | Luồng đầu cuối trên máy tính/điện thoại; build/test/lint/RLS; lỗi được xử lý hoặc ghi rõ | **Người dùng duyệt phase 2** |
| 2 — Thực học và tiền | 2.1 Chốt từng em | T-02.1, T-02.2 | RPC + UI trạng thái từng em, giờ/phút riêng, áp dụng chung, snapshot và tiền đúng |  |
| 2 | 2.2 Hủy, bù, điều chỉnh | T-02.3 | Liên kết dạy bù đúng em; sửa sau chốt có lý do, khoản điều chỉnh và audit |  |
| 2 | 2.3 Review | T-02.4 | Giá đổi giữa tháng, học nhóm, qua nửa đêm, sửa sau chốt và RLS | **Người dùng duyệt phase 3** |
| 3 — Tháng và thanh toán | 3.1 Dữ liệu tài chính | T-03.3 | Bảng/RLS/RPC payment, đọc điều chỉnh từ phase 2, nhận/hoàn nhiều lần, không vượt phải thu |  |
| 3 | 3.2 Báo cáo tháng | T-03.1, T-03.2 | Chi tiết từng em và tổng quan cùng một bộ dữ liệu, phân kỳ Việt Nam |  |
| 3 | 3.3 Giao diện thanh toán | T-03.3 | Nhập và xem giao dịch, số phải thu/đã thu/còn thu/đối soát |  |
| 3 | 3.4 Review | T-03.4 | Đối chiếu 320.000đ − 200.000đ = 120.000đ; RLS A/B; điều chỉnh sau thu | **Người dùng duyệt phase 4** |
| 4 — File và khôi phục | 4.1 Mẫu xuất và XLSX | T-04.1, T-04.2 | Mô hình bảng kê chung; XLSX giữ số tiền kiểu số và ngày Việt Nam |  |
| 4 | 4.2 PDF | T-04.3 | PDF A4/điện thoại có font Unicode tiếng Việt, tổng khớp |  |
| 4 | 4.3 Sao lưu/khôi phục | T-04.4 | Hướng dẫn, bản thử và đối soát dữ liệu sau restore trên môi trường thử |  |
| 4 | 4.4 Review cuối | T-04.5 | Màn hình–XLSX–PDF khớp; quyền truy cập file và phục hồi được kiểm tra | **Bàn giao giai đoạn 1–4; không tự phát hành** |

## Bản đồ file trước khi triển khai

| Phần | File hiện có | File dự kiến tạo/sửa | Trách nhiệm |
|---|---|---|---|
| Nền local | `supabase/migrations/202611100001_core_schema.sql` đến `202611100006_teacher_cleanup.sql`, `supabase/tests/`, `scripts/smoke-local-auth.mjs` | migration/test tiếp theo; `README.md` | Toàn vẹn dữ liệu, RLS, test tái lập từ database trống |
| Auth và học sinh | `web/src/App.tsx`, `features/auth/`, `features/students/` | sửa các file hiện có và test cạnh chúng | Guard, đăng nhập/đăng xuất, giá hiệu lực, form và lịch sử |
| Lịch | `features/calendar/CalendarPage.tsx`, `features/sessions/sessions-gateway.ts` | tách form/chi tiết khi cần; test UI và RPC | Lịch nhóm, sửa/xóa, lọc, cảnh báo |
| Thực học | `web/src/domain/{money,rate,attendance,period}.ts`, `session_students` | migration/test attendance; `features/attendance/` | Chốt theo em, giá snapshot, audit và dạy bù |
| Thanh toán/báo cáo | `web/src/domain/monthly-report.ts` | migration/test `fee_adjustments` ở phase 2 và `payments` ở phase 3; `features/monthly-summary/`, `features/payments/` | Giao dịch gốc, đối soát, báo cáo từng em và toàn lớp |
| Xuất/backup | chưa có | `domain/export-model.ts`, `features/exports/`, `docs/backup-restore.md` | Một dữ liệu xuất chung, XLSX/PDF, khôi phục thử |

## Review Focus

1. Xóa giáo viên thử sau khi đã có lịch/participation/audit phải dọn sạch hoặc từ chối có chủ đích, không để HTTP 500 mơ hồ — kiểm tra ở Phiên 1.1.
2. Giá tương lai không được hiển thị như giá đang có hiệu lực; `bigint` vượt giới hạn số an toàn phải bị từ chối hoặc xử lý chính xác — Phiên 1.2 và 2.1.
3. Lịch nhóm chồng với mục riêng phải cảnh báo đúng tên và khung giờ, nhưng vẫn lưu; hai lịch chỉ chạm đầu mút không báo trùng — Phiên 1.3.
4. An học, Bình nghỉ cùng buổi: chỉ An có tiền; buổi bắt đầu 30/11 kết thúc 01/12 thuộc tháng 11 của An — Phiên 2.1 và 3.2.
5. Sửa giảm tiền sau khi đã thu không làm mất giao dịch; khoản cần đối soát phải tách khỏi “còn thu”; màn hình và hai file phải cùng tổng — Phiên 3.4 và 4.4.

## Phase 1 — Hoàn thiện bản lịch local

### Phiên 1.1 — Sửa nền dữ liệu và tái lập môi trường

**Files:** `supabase/migrations/`, `supabase/tests/007_teacher_cleanup.sql`, `scripts/smoke-local-auth.mjs`, `.codex/PROGRESS.md`.

- [ ] Tái hiện và ghi mã lỗi của bước xóa tài khoản thử **sau khi đã tạo lịch nhóm**; không in khóa, token hoặc mật khẩu.
- [ ] Viết test SQL thất bại cho xóa giáo viên có `sessions` và `session_students`, đồng thời giữ bất biến không xóa cứng một học sinh có lịch khi tài khoản còn hoạt động.
- [ ] Sửa quan hệ/trigger bằng migration tiếp theo, giữ audit và quyền sở hữu đúng; chạy test mới tới PASS.
- [ ] Dựng database local từ migration trên môi trường thử có thể xóa, chạy `npx supabase test db` và `node scripts/smoke-local-auth.mjs`; xác nhận script thoát mã 0 và không để lại tài khoản thử.
- [ ] Ghi kết quả, cập nhật trạng thái lỗi và tạo mốc Git sau khi test qua.

### Phiên 1.2 — Auth, học sinh và giá hiệu lực

**Files:** `web/src/App.tsx`, `web/src/features/auth/`, `web/src/features/students/`, test cùng thư mục.

- [ ] Viết test thất bại cho trạng thái chưa đăng nhập/đăng xuất, sửa hồ sơ, thêm giá trùng ngày và giá tương lai; thêm trường hợp số tiền vượt `Number.MAX_SAFE_INTEGER`.
- [ ] Sửa guard và truy vấn học sinh; tính “giá hiện hành” theo ngày Việt Nam, giữ giá tương lai trong lịch sử và không sửa giá đã chốt.
- [ ] Kiểm thử hai giáo viên A/B qua API và UI local: không thấy dữ liệu của nhau; test đơn giá 100.000đ/120.000đ.
- [ ] Chạy test liên quan, build và lint; ghi kết quả thật vào `PROGRESS.md`.

### Phiên 1.3 — Lịch nhóm và cảnh báo

**Files:** `web/src/features/calendar/`, `web/src/features/sessions/`, test liên quan, RPC lịch đã có.

- [ ] Viết test UI/RPC thất bại cho tạo nhóm An+Bình 18:00–19:30, sửa sang 19:00, xóa mềm và audit; kiểm tra lịch chỉ chạm đầu mút.
- [ ] Hoàn thiện ngày/tuần/tháng, lọc học sinh, trạng thái chữ, hiển thị nhóm; báo trùng tên/giờ và nút “Vẫn lưu lịch”.
- [ ] Chạy test và thử CRUD lịch qua API local; xác nhận `scheduled` = 0đ và giáo viên B không sửa được lịch A.
- [ ] Ghi bằng chứng; chỉ đánh dấu T-01.5/T-01.6 nếu thao tác trên UI và dữ liệu thật local cùng đạt.

### Phiên 1.4 — Review phase 1

**Files:** `.codex/TASKS.md`, `.codex/PROGRESS.md`, `README.md`, sửa UI nếu review phát hiện lỗi.

- [ ] Chạy `npm test`, `npm run build`, `npm run lint`, `npx supabase test db` và smoke API; không gọi “qua” nếu chỉ chạy được một phần.
- [ ] Kiểm tra luồng đăng nhập → học sinh/giá → lịch nhóm/trùng giờ → sửa/xóa trên điện thoại và máy tính; kiểm tra bàn phím, focus, ngày giờ, tương phản.
- [ ] Đối chiếu PRD/ARCHITECTURE/DESIGN/README với trạng thái thật; cập nhật câu mô tả đã cũ.
- [ ] Ghi lỗi còn lại, chỉ nghiệm thu T-01.1/T-01.3–01.7 khi đạt; trình bày kết quả và **chờ đồng ý phase 2**.

## Phase 2 — Thực học và tiền từng em

### Phiên 2.1 — Chốt tham gia, giá và tiền

**Files:** `supabase/migrations/` (attendance RPC), `supabase/tests/` (attendance/RLS), `web/src/domain/{money,rate,attendance,period}.ts`, `web/src/features/attendance/`.

- [ ] Viết test thất bại cho An hoàn thành 90 phút/Bình nghỉ, áp dụng chung rồi sửa riêng, giá đổi giữa tháng, giá riêng thiếu lý do, 100.001đ × 30 phút = 50.001đ, và người B gọi RPC trên dữ liệu A.
- [ ] Tạo RPC chốt theo em trong giao dịch: kiểm tra owner, giờ/phút, giá hiệu lực, snapshot, phép tính nguyên VND và audit; UI cho nhập trạng thái/giờ/phút riêng và áp dụng chung.
- [ ] Chạy test SQL/UI, kiểm tra dòng `scheduled` vẫn 0đ, dựng lại database từ migration và ghi kết quả.

### Phiên 2.2 — Hủy, dạy bù và sửa sau chốt

**Files:** migration/RPC attendance và `fee_adjustments`, `supabase/tests/`, `web/src/features/attendance/`, `web/src/domain/attendance.ts`.

- [ ] Viết test thất bại cho nghỉ/hủy 0đ, phí đặc biệt có lý do, dạy bù đúng một em, không đếm hai lần, sửa tiền sau chốt có before/after/reason.
- [ ] Triển khai liên kết `makeup_for_id`, bảng/RLS/RPC `fee_adjustments` và audit; không xóa cứng dòng đã chốt.
- [ ] Kiểm tra hai giáo viên A/B, dữ liệu nhóm một em học một em nghỉ, test UI và SQL.

### Phiên 2.3 — Review phase 2

**Files:** `.codex/TASKS.md`, `.codex/PROGRESS.md`, mã liên quan nếu phát hiện lỗi.

- [ ] Chạy bộ test tiền/RLS, build/lint và kiểm tra trên UI: giá đổi, phút khác dự kiến, qua nửa đêm, hủy/bù, sửa sau chốt.
- [ ] Ghi kết quả và lỗi; chỉ nghiệm thu T-02.1–02.4 khi đủ; **chờ đồng ý phase 3**.

## Phase 3 — Tổng kết tháng và thanh toán

### Phiên 3.1 — Schema và RPC giao dịch

**Files:** migration `payments`, test SQL/RLS; dùng `fee_adjustments` đã tạo ở Phiên 2.2.

- [ ] Viết test thất bại cho nhận nhiều lần, hoàn trả, điều chỉnh có lý do, vượt phải thu bị từ chối, giao dịch A không truy cập B.
- [ ] Tạo bảng/RLS/RPC ghi payment có audit và kết nối khoản điều chỉnh đã có; không sửa/xóa âm thầm giao dịch gốc.
- [ ] Chạy test SQL từ database trống và đối chiếu bất biến số nguyên VND.

### Phiên 3.2 — Báo cáo tháng từng em và tổng quan

**Files:** `web/src/domain/monthly-report.ts`, `web/src/features/monthly-summary/`, test tương ứng.

- [ ] Viết test thất bại cho tháng theo `actual_start_at` từng em, buổi 30/11 qua 01/12, không cộng tiền Bình vào An, tổng quan bằng tổng báo cáo em.
- [ ] Nối dữ liệu đã chốt và giao dịch qua truy vấn RLS vào chi tiết từng em và tổng quan; hiển thị số buổi/phút/phải thu/đã thu/còn thu/đối soát.
- [ ] Chạy test domain/UI và kiểm tra dữ liệu local A/B.

### Phiên 3.3 — Giao diện ghi nhận thanh toán

**Files:** `web/src/features/payments/`, test UI và RPC liên quan.

- [ ] Viết test thất bại cho An phải thu 320.000đ, nhận 200.000đ, còn 120.000đ; thêm khoản nhận/hoàn và lỗi vượt phải thu.
- [ ] Làm form và nhật ký giao dịch có ngày, học sinh, kỳ, phương thức, số tiền và lý do khi điều chỉnh.
- [ ] Kiểm tra số liệu trên UI khớp hàng gốc trong database và không lộ dữ liệu B.

### Phiên 3.4 — Review phase 3

**Files:** `.codex/TASKS.md`, `.codex/PROGRESS.md`, mã liên quan nếu phát hiện lỗi.

- [ ] Đối chiếu tổng báo cáo, thanh toán, hoàn tiền và điều chỉnh sau đã thu; kiểm tra “cần đối soát” tách khỏi “còn thu”.
- [ ] Chạy test SQL/UI, build/lint, ghi bằng chứng; chỉ nghiệm thu T-03.1–03.4 khi đủ; **chờ đồng ý phase 4**.

## Phase 4 — File xuất và khôi phục

### Phiên 4.1 — Mô hình xuất chung và XLSX

**Files:** `web/src/domain/export-model.ts`, `web/src/features/exports/export-xlsx.ts`, test tương ứng.

- [ ] Viết test thất bại cho mọi dòng/tổng khớp báo cáo tháng, tiền XLSX là số, ngày/giờ Việt Nam và tên có dấu.
- [ ] Chọn thư viện XLSX phù hợp khi thực hiện; dùng một `ExportModel` có kiểu rõ cho màn hình và file.
- [ ] Tạo XLSX, mở file thử và cộng cột tiền; ghi phiên bản thư viện và kết quả.

### Phiên 4.2 — PDF Unicode

**Files:** `web/src/features/exports/export-pdf.ts`, font Unicode đóng gói hợp lệ, test PDF.

- [ ] Viết test thất bại cho nội dung và tổng PDF khớp `ExportModel`, tên/ghi chú tiếng Việt không lỗi dấu.
- [ ] Tạo bố cục A4, dùng font hỗ trợ tiếng Việt; kiểm tra file thực tế trên máy tính và điện thoại.
- [ ] Đối chiếu PDF với XLSX/màn hình cho cùng học sinh và kỳ.

### Phiên 4.3 — Sao lưu và thử khôi phục

**Files:** `docs/backup-restore.md`, script kiểm đếm thử nếu cần.

- [ ] Ghi quy trình xuất, lưu giữ và khôi phục **dữ liệu thử**; không đưa khóa hoặc dữ liệu thật vào repository.
- [ ] Thử restore trên môi trường local riêng có thể xóa; đối chiếu số học sinh, giá, lịch, dòng học, điều chỉnh và thanh toán trước/sau.
- [ ] Ghi lệnh, kết quả và thời gian phục hồi vào `PROGRESS.md`.

### Phiên 4.4 — Review cuối giai đoạn 1–4

**Files:** `.codex/TASKS.md`, `.codex/PROGRESS.md`, `README.md`, mã phát sinh sửa lỗi.

- [ ] Chạy toàn bộ test SQL/UI, build/lint và một luồng từ đăng nhập đến xuất file; kiểm tra RLS A/B và chưa có khóa quản trị trong frontend.
- [ ] So từng dòng và tổng giữa màn hình, XLSX, PDF; kiểm tra font, số tiền kiểu số và kết quả restore.
- [ ] Ghi bằng chứng và lỗi còn lại; chỉ đánh dấu T-04.1–04.5 khi đủ. Bàn giao để người dùng quyết định việc phát hành riêng ở giai đoạn 5.
