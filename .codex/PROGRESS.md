# PROGRESS — Nhật ký tiến độ

**Cập nhật:** 10/11/2026 · **Giai đoạn hiện tại:** 1 — bản lịch chạy local
**Tình trạng sản phẩm:** Có giao diện Auth/học sinh/lịch nối Supabase local và migration/RLS nền. Chưa nghiệm thu đầu cuối hoặc phát hành; giai đoạn 2–4 chưa triển khai thành chức năng hoàn chỉnh.

**Kế hoạch 10/11/2026:** Đã đọc lại bộ tài liệu Markdown và lập [kế hoạch 15 phiên cho giai đoạn 1–4](../docs/superpowers/plans/2026-11-10-cac-phien-giai-doan-1-4.md). Người dùng đã đồng ý bắt đầu. Cổng duyệt sau từng phase vẫn áp dụng.

## Phiên 1.1 — 10/11/2026

- Xác nhận migration `202611100008_defer_participant_student_fk.sql` và test `007_teacher_cleanup.sql` đã có trong workspace giải quyết quan hệ xóa giáo viên có lịch. Test cũng xác nhận không xóa cứng học sinh còn gắn lịch khi giáo viên đang hoạt động.
- `npx supabase test db`: **67/67 qua**. `node scripts/smoke-local-auth.mjs`: **exit 0**, gồm đăng nhập A/B, RLS, lịch nhóm, sửa/xóa mềm, audit và dọn tài khoản thử.
- `npx supabase db reset`: **exit 0**, áp dụng đủ 8 migration từ database local; sau reset, SQL test lại **67/67 qua** và smoke API lại **exit 0**.
- Supabase CLI cần `SUPABASE_TELEMETRY_DISABLED=1` và quyền gọi Docker ngoài sandbox; các lệnh đã chạy được sau khi cấp quyền thực thi cần thiết. Không ghi khóa hoặc token vào repository.
- Lỗi dọn tài khoản có lịch đã được kiểm tra lại là hết trong môi trường local. Chưa thay đổi trạng thái nghiệm thu T-01.1 vì còn kiểm tra giao diện ở Phiên 1.4.

## Review theo yêu cầu người dùng — 10/11/2026

- **Tiến độ nghiệm thu giai đoạn 1–4:** 1/20 task = **5%** (`T-01.2`). Nếu kể cả giai đoạn 0: 4/23 task = 17,4%. Đây là tỷ lệ task đạt tiêu chí trong `TASKS.md`, không đo lượng mã đã viết.
- **Giai đoạn 1 đã có mã:** guard đăng nhập/đăng xuất; màn hình và RPC học sinh/đơn giá; tạo/sửa/xóa mềm lịch nhóm; lọc lịch ngày/tuần/tháng theo danh sách; cảnh báo trùng giờ cho phép lưu. Các task T-01.1, T-01.3–01.7 vẫn chưa đánh dấu vì chưa kiểm tra đầy đủ luồng trên trình duyệt và hai kích thước màn hình.
- **Giai đoạn 2–3:** có các hàm TypeScript thuần và test cho làm tròn tiền, chọn giá theo hiệu lực, tham gia từng em, kỳ tháng và tổng hợp. Chưa có thao tác chốt buổi, payment, adjustment, giao diện báo cáo hay bảo vệ dữ liệu tương ứng trên database.
- **Giai đoạn 4:** chưa có XLSX, PDF, backup hoặc thử khôi phục.
- **Bằng chứng kiểm tra gần nhất:** `npx supabase test db` **60/60 qua** sau 6 migration; test riêng Auth/Calendar **4/4 qua**, test StudentsPage **2/2 qua**; `npm run build` qua sau khi tích hợp lịch. Smoke API qua đăng nhập A/B, RLS, tạo lịch nhóm 0đ, sửa, xóa mềm và audit, nhưng **exit code 1 ở bước xóa tài khoản thử sau khi đã tạo lịch**. Đây là lỗi chưa xử lý, không tính smoke test là qua.
- **Kiểm tra bị hạn chế:** `npm test` toàn bộ mới nhất không khởi động được vì sandbox chặn tiến trình con (`spawn EPERM`). Lần yêu cầu chạy với quyền cần thiết bị auto-review từ chối do **giới hạn sử dụng**, không phải kết luận hành động không an toàn. `npm run lint` chạy được, exit 0 nhưng báo **4 cảnh báo** về `useEffect`/dependency tại `StudentsPage.tsx` và `CalendarPage.tsx`.

### Việc cần sửa theo ưu tiên

1. **Cao — dọn tài khoản có lịch:** xác định lỗi cụ thể khiến Admin API không xóa được tài khoản thử sau tạo lịch; kiểm tra khóa ngoại/trigger, thêm test hồi quy SQL và chạy lại smoke API. Lỗi HTTP 500 khi xóa tài khoản chỉ có hồ sơ/giá đã được sửa ở migration `202611100006_teacher_cleanup.sql`, nhưng trường hợp đã có lịch vẫn còn lỗi chưa rõ mã HTTP.
2. **Cao — giá hiển thị:** danh sách học sinh đang dùng bản ghi giá có ngày hiệu lực mới nhất, kể cả ngày tương lai; cần chọn giá có hiệu lực tại ngày xem. Kiểm tra `bigint` chuyển sang `number` an toàn cho tiền.
3. **Cao — nghiệm thu giai đoạn 1:** thử trọn luồng đăng nhập → học sinh/giá → lịch nhóm/trùng giờ → sửa/xóa trên trình duyệt và màn hình điện thoại/máy tính; xác minh dữ liệu A/B; ghi bằng chứng rồi mới đánh dấu T-01.1, T-01.3–01.7.
4. **Vừa — chất lượng mã:** giải quyết 4 cảnh báo lint; test sửa hồ sơ/thêm giá và sửa/xóa lịch ở UI; cập nhật README theo chức năng hiện có. Kiểm tra truy vấn danh sách lịch khi dữ liệu lớn trước khi dùng thật.
   Toàn bộ file hiện chưa được commit trong repository mới khởi tạo; tạo commit sau khi kiểm tra lại để có mốc khôi phục rõ ràng.
5. **Tiếp theo — giai đoạn 2–4:** hoàn thiện schema/RPC chốt tham gia và tiền, điều chỉnh/thanh toán, báo cáo, XLSX/PDF, backup và thử khôi phục theo thứ tự `TASKS.md`.

## Đã hoàn thành

| ID | Kết quả | Bằng chứng |
|---|---|---|
| T-00.1 | Đã tạo sáu tài liệu nền từ prompt và kế hoạch có chú thích: PRD, kiến trúc, thiết kế giao diện, quy tắc viết mã, task và tiến độ. | Các file [PRD.md](PRD.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN.md](DESIGN.md), [RULES.md](RULES.md), [TASKS.md](TASKS.md), [PROGRESS.md](PROGRESS.md) trong `.codex/`. |
| Cập nhật thiết kế | Đã đổi định hướng giao diện sang hồng pastel dịu, dễ thương cho món quà tặng bạn gái; đã đồng bộ tiêu chí giao diện trong PRD và task giai đoạn 1. | [DESIGN.md](DESIGN.md), [PRD.md](PRD.md), [TASKS.md](TASKS.md). |
| Rà soát tài liệu 09/11/2026 | Đã sửa năm liên kết nội bộ bị hỏng và thống nhất vị trí sáu tài liệu trong `.codex/`. Chưa thay đổi trạng thái task hoặc quy tắc nghiệp vụ. | Kiểm tra lại mọi liên kết Markdown nội bộ: không còn đường dẫn lỗi. |
| T-00.2 | Người dùng đã đồng ý cả năm mặc định nghiệp vụ tại PRD mục 8. | [Quyết định ngày 09/11/2026](../docs/decisions.md); xác nhận trực tiếp trong cuộc trao đổi. |
| T-00.3 | Người dùng đã yêu cầu triển khai toàn bộ giai đoạn 1–4; phạm vi giai đoạn 1 được chấp nhận như trong TASKS. | [Quyết định ngày 09/11/2026](../docs/decisions.md); xác nhận trực tiếp trong cuộc trao đổi. |

Các tài liệu đã phản ánh bốn điểm người dùng chú thích: **chỉ giáo viên thao tác; đơn giá riêng từng học sinh; mục lịch dự kiến có thể sửa/xóa và chưa tính tiền; một buổi có nhiều em hoặc các mục lịch chồng giờ**.

Đã kiểm tra sự hiện diện của cả sáu file, rà lại các quy tắc trên giữa PRD/kiến trúc/thiết kế/task và kiểm tra các hàng bảng Markdown không bị thiếu dấu `|` cuối dòng. Đây là kiểm tra tài liệu, **không phải kiểm thử ứng dụng**.

## Đang chờ/chưa làm

- T-01.1 vẫn chờ kiểm tra trực quan; T-01.3 đến T-05.3 chưa nghiệm thu. Chưa có bản xuất file hay triển khai.

## Đang triển khai — T-01.1

- Đã khởi tạo Git trên nhánh `feature/giai-doan-1`, tạo Vite/React/TypeScript, giao diện khung hồng pastel và hướng dẫn chạy/cấu hình mẫu.
- Mốc ban đầu: `npm test` 22/22 qua trước khi bổ sung Auth, học sinh, lịch và migration; kết quả kiểm tra mới hơn nằm ở phần review trên.
- Chưa thể kiểm tra trực quan trên trình duyệt điện thoại/máy tính vì công cụ điều khiển trình duyệt không kết nối được. Vì vậy T-01.1 chưa được đánh dấu hoàn thành.

## Hoàn thành — T-01.2

- Đã tạo sáu bảng nền, khóa ngoại cùng chủ sở hữu, RLS và RPC tạo/sửa/xóa mềm lịch trong migration. Đăng ký công khai đã tắt trong cấu hình Auth local.
- Ngày 10/11/2026: `npx supabase db reset` dựng lại database từ bốn migration nền thành công; mốc 46/46 kiểm thử qua. Sau đó thêm hai migration cho học sinh/giá và quan hệ audit; mốc gần nhất 60/60 kiểm thử qua. Chưa reset lại database từ trống sau hai migration mới.

## Lỗi và rủi ro đã biết

| Mục | Trạng thái | Hướng xử lý |
|---|---|---|
| Gói hosting/database miễn phí | Quota và điều khoản có thể thay đổi. | Kiểm tra lại tài liệu chính thức trước khi triển khai và dùng dữ liệu thật. |
| Chưa có backup dữ liệu thật | Chưa có dữ liệu thật nên chưa có bản sao lưu. | Làm T-04.4 và thử khôi phục trước khi nhập dữ liệu thật. |

## Bước tiếp theo

1. Giải quyết lỗi dọn tài khoản có lịch và kiểm thử hồi quy.
2. Hoàn thiện và nghiệm thu giai đoạn 1; chạy test tổng khi quyền thực thi tiến trình con khả dụng và kiểm tra giao diện trên trình duyệt.
3. Tiếp tục giai đoạn 2–4; cập nhật bằng chứng và chỉ đánh dấu `[x]` khi tiêu chí nghiệm thu đạt.
