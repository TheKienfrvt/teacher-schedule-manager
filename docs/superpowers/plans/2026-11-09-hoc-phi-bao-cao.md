# Giai đoạn 2–4 — Học phí và báo cáo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chốt học phí theo từng học sinh, tổng kết và ghi thanh toán theo tháng, xuất XLSX/PDF tiếng Việt và sao lưu có thử khôi phục.

**Architecture:** Mỗi `session_student` là một dòng tham gia với thời gian và giá chốt riêng. Database giữ giao dịch, quyền truy cập và audit; các hàm TypeScript thuần tạo bảng kê từ dữ liệu đã được RLS cho phép đọc. Màn hình, XLSX và PDF dùng chung một mô hình bảng kê để tránh lệch tổng.

**Tech Stack:** React/TypeScript, Supabase PostgreSQL, Vitest, thư viện XLSX/PDF được chọn khi làm xuất file.

**Spec:** [PRD](../../../.codex/PRD.md), [quyết định nghiệp vụ](../../decisions.md), [kiến trúc](../../../.codex/ARCHITECTURE.md), [task](../../../.codex/TASKS.md).

## Global Constraints

- Áp dụng năm quyết định đã chốt ngày 09/11/2026 trong `docs/decisions.md`.
- Tiền và phút là số nguyên; `floor((rate_vnd_per_hour × actual_minutes + 30) / 60)` được tính cho từng em/từng buổi.
- Tháng xác định từ `actual_start_at` của chính em theo `Asia/Ho_Chi_Minh`.
- Dòng `scheduled`, `absent`, `cancelled` không có tiền học; phí đặc biệt là điều chỉnh có lý do.
- Sửa khoản đã chốt và giao dịch tiền phải có audit; không xóa cứng dữ liệu tài chính.
- Không đánh dấu task hoàn thành khi chưa kiểm tra với Supabase local và dữ liệu mẫu.

## Review Focus

- Giá 100.001đ/giờ × 30 phút phải cho 50.001đ, tránh làm tròn bằng số thực.
- Buổi 30/11 23:30–01/12 00:30 thuộc kỳ tháng 11 của em bắt đầu lúc 23:30.
- Học nhóm có An học và Bình nghỉ: chỉ dòng An có tiền học.
- Sửa sau đã nhận tiền có thể tạo số dư cần đối soát, không gán nhãn “còn thu” âm.
- Một khoản hoàn trả làm giảm số đã thu và tăng số còn phải thu đúng một lần.

---

### Task 1: Tính tiền và kỳ tháng (T-02.1, T-02.2 phần miền)

**Files:** `web/src/domain/money.ts`, `web/src/domain/money.test.ts`, `web/src/domain/period.ts`, `web/src/domain/period.test.ts`.

**Interfaces:** `calculateCharge(rateVndPerHour: number, actualMinutes: number): number`; `periodForInstant(instant: string): string` trả `YYYY-MM` theo Việt Nam.

- [ ] Viết test cho 100.000 × 90 = 150.000, 100.001 × 30 = 50.001, phút/giá âm và buổi qua nửa đêm; chạy để thấy thất bại.
- [ ] Triển khai phép tính nguyên an toàn và phân kỳ Việt Nam.
- [ ] Chạy lại test và toàn bộ suite, ghi kết quả.

### Task 2: Chốt tham gia và sửa sau chốt (T-02.1–T-02.4)

**Files:** `supabase/migrations/0002_attendance.sql`, `supabase/tests/attendance.sql`, `web/src/features/attendance/AttendancePage.tsx`, `web/src/features/attendance/attendance.ts`, `web/src/features/attendance/attendance.test.tsx`.

**Interfaces:** RPC chốt từng dòng tham gia, áp dụng thời gian chung cho nhóm, liên kết dạy bù theo `session_student_id`, chốt snapshot giá và audit cùng giao dịch.

- [ ] Viết test cho An học/Bình nghỉ, đổi giá, giá riêng có lý do, hủy/bù và sửa có audit; chạy để thấy thất bại.
- [ ] Thêm migration/RPC với ràng buộc quyền, trạng thái và số tiền.
- [ ] Xây giao diện xác nhận từng em và nút áp dụng chung.
- [ ] Chạy test database, UI, build và review dữ liệu đã chốt; cập nhật T-02.x theo từng tiêu chí đạt.

### Task 3: Tổng kết tháng và thanh toán (T-03.1–T-03.4)

**Files:** `supabase/migrations/0003_payments.sql`, `supabase/tests/payments.sql`, `web/src/domain/monthly-report.ts`, `web/src/domain/monthly-report.test.ts`, `web/src/features/monthly-summary/SummaryPage.tsx`, `web/src/features/payments/PaymentsPage.tsx`.

**Interfaces:** `buildMonthlyReport(student, period, rows, adjustments, payments)` trả chi tiết và tổng; RPC ghi nhận/hoàn tiền theo học sinh/kỳ, từ chối số nhận vượt phải thu và lưu audit.

- [ ] Viết test tổng học sinh/nhóm, 320.000−200.000=120.000, nhận nhiều lần, hoàn tiền và điều chỉnh sau thu; chạy để thấy thất bại.
- [ ] Tạo bảng/RLS/RPC cho `fee_adjustments` và `payments` với audit.
- [ ] Xây trang tổng quan mọi học sinh và chi tiết từng em; cùng một dữ liệu cho màn hình.
- [ ] Chạy kiểm thử quyền A/B, đối soát tổng và build; cập nhật T-03.x khi đạt.

### Task 4: Xuất bảng kê (T-04.1–T-04.3)

**Files:** `web/src/domain/export-model.ts`, `web/src/domain/export-model.test.ts`, `web/src/features/exports/export-xlsx.ts`, `web/src/features/exports/export-pdf.ts`, `web/src/features/exports/ExportsPage.tsx`.

**Interfaces:** Màn hình, XLSX và PDF cùng nhận `MonthlyReport`; file chỉ chứa một học sinh/kỳ được chọn.

- [ ] Viết test cho cột và tổng bảng kê, số tiền XLSX kiểu số và PDF tiếng Việt; chạy để thấy thất bại.
- [ ] Chọn thư viện còn được duy trì, thêm font Unicode cho PDF.
- [ ] Xây xem trước và nút tải hai định dạng.
- [ ] Mở thực tế XLSX/PDF và đối chiếu từng dòng/tổng với màn hình; cập nhật T-04.1–T-04.3.

### Task 5: Sao lưu và review giai đoạn 4 (T-04.4, T-04.5)

**Files:** `docs/backup-restore.md`, `.codex/PROGRESS.md`, `.codex/TASKS.md`.

**Interfaces:** Quy trình xuất và khôi phục bộ dữ liệu thử, có đối soát học sinh, lịch, giá, học phí và thanh toán.

- [ ] Tạo hướng dẫn backup/restore và chạy thử trên môi trường local riêng.
- [ ] Đối chiếu dữ liệu trước/sau khôi phục, kiểm tra quyền và ba nơi hiển thị.
- [ ] Ghi lệnh/kết quả/lỗi còn lại; chỉ đánh dấu T-04.4/T-04.5 khi nghiệm thu đủ.
