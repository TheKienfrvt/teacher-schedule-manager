# PROGRESS — Nhật ký tiến độ

**Cập nhật:** 11/11/2026 · **Giai đoạn hiện tại:** 1 — bản lịch chạy local đã review
**Tình trạng sản phẩm:** T-01.1–T-01.7 đã nghiệm thu trong môi trường local; chưa phát hành. Giai đoạn 2–4 chưa triển khai thành chức năng hoàn chỉnh và đang chờ cổng duyệt phase 2.

**Kế hoạch 10/11/2026:** Đã đọc lại bộ tài liệu Markdown và lập [kế hoạch 15 phiên cho giai đoạn 1–4](../docs/superpowers/plans/2026-11-10-cac-phien-giai-doan-1-4.md). Người dùng đã đồng ý bắt đầu. Cổng duyệt sau từng phase vẫn áp dụng.

## Bổ sung lịch tháng/tuần — 11/11/2026

- Theo yêu cầu mới, lịch tháng dùng lưới ngày; lịch tuần hiện bảy ngày. Ô có lịch hiển thị số buổi, giờ và học sinh. Chọn ngày để xem từng buổi gồm giờ bắt đầu/kết thúc, học sinh, hình thức, địa điểm/link, ghi chú và trạng thái dự kiến 0đ. Có nút chuyển tuần/tháng trước/sau và lọc học sinh.
- Trên điện thoại 390px, lịch tuần thành danh sách ngày; lịch tháng giữ lưới gọn và thêm danh sách ngày có lịch với giờ, tên học sinh đầy đủ. Chọn ngày trong cùng khoảng xem không gọi lại API. Ảnh Chrome thật: [tháng desktop](../docs/previews/phase1-calendar-month-desktop.png), [tháng mobile](../docs/previews/phase1-calendar-month-mobile.png), [tuần mobile](../docs/previews/phase1-calendar-mobile.png).
- `npm test` **54/54 qua**; lint, build, `git diff --check` qua. Browser smoke `--mobile-writes` **exit 0**, gồm chọn ngày 12/11 qua danh sách tháng, xem link học, quay lại ngày 10/11, thao tác ghi trên mobile và dọn tài khoản thử. Không đổi phạm vi phase 2–4; tổng task nghiệm thu vẫn 7/20 (35%).

## Review giai đoạn 1 — 11/11/2026

- `node scripts/smoke-local-browser.mjs` và `node scripts/smoke-local-browser.mjs --mobile-writes` đều **exit 0** với Chrome/Supabase local. Tài khoản thử được tự dọn. Trình duyệt đã tạo/sửa học sinh, thêm giá tương lai và xác nhận giá hiện hành không đổi; tạo lịch nhóm trùng giờ, thấy cảnh báo, vẫn lưu, sửa sang 19:00, xóa mềm, đối chiếu ba audit; đăng xuất xóa cache. Luồng ghi chạy ở desktop và viewport mobile 390px.
- Ảnh mobile đã xem trực quan: [lịch](../docs/previews/phase1-calendar-mobile.png), [học sinh](../docs/previews/phase1-students-mobile.png), [form học sinh](../docs/previews/phase1-student-form-mobile.png), [form lịch](../docs/previews/phase1-calendar-form-mobile.png). Kiểm tra độ rộng trang không vượt viewport và nút Lưu không bị thanh điều hướng cố định che khi cuộn tới cuối. Ảnh desktop ở [lịch](../docs/previews/phase1-calendar-desktop.png) và [học sinh](../docs/previews/phase1-students-desktop.png).
- Đã thêm nhãn chữ **“Dự kiến · 0đ · Học nhóm”** cho lịch nhóm chưa chốt. Test giao diện kiểm tra thời lượng tùy chọn 45 phút và link online; test ngày/tuần/tháng, lọc học sinh, cảnh báo trùng, giá riêng và giá âm đã có. `npm test` **53/53 qua** ở 17 file; lint không cảnh báo; production build qua.
- `npx supabase test db` **67/67 qua**; `node scripts/smoke-local-auth.mjs` **exit 0**, xác nhận RLS A/B, lịch nhóm `scheduled` 0đ, sửa/xóa mềm và audit. `git diff --check` sạch.
- **Nghiệm thu:** đánh dấu T-01.4–T-01.7, đưa giai đoạn 1 lên 7/7 task. Toàn bộ giai đoạn 1–4 hiện 7/20 = 35%. Dừng trước phase 2 để người dùng duyệt. Giới hạn còn lại: chưa thử trên điện thoại vật lý, chưa đo tải dữ liệu lớn hoặc kiểm tra cấu hình HTTPS/CSP/backup của môi trường phát hành.

## Kiểm tra trình duyệt và nghiệm thu T-01.1, T-01.3 — 10/11/2026

- `scripts/smoke-local-browser.mjs` tạo tài khoản thử local, tạo An/Bình và một lịch nhóm, đăng nhập qua Chrome thật, xem lịch/học sinh ở desktop 1440px và mobile 390px, đăng xuất và xác nhận cache riêng tư đã xóa. Script tự dọn tài khoản thử; **exit 0**. Cả hai trang ở 390px có `document.scrollWidth` bằng viewport, ảnh đã xem trực quan: [lịch desktop](../docs/previews/phase1-calendar-desktop.png), [lịch mobile](../docs/previews/phase1-calendar-mobile.png), [học sinh desktop](../docs/previews/phase1-students-desktop.png), [học sinh mobile](../docs/previews/phase1-students-mobile.png).
- Lần thử đầu cho thấy `.env.local` có UTF-8 BOM khiến Vite bỏ qua biến URL đầu file. Đã bỏ BOM trong file local (không in khóa), khởi động lại Vite và xác nhận hai biến được nạp. File này nằm trong `.gitignore`, không chứa trong bản bàn giao.
- Chuyển xử lý sự kiện Auth ra khỏi callback đồng bộ của Supabase để tránh cuộc gọi API trong callback gây treo; có test cho trì hoãn callback. Bỏ qua `INITIAL_SESSION` vì app đã gọi `getUser()` lúc khởi động, và bỏ qua `TOKEN_REFRESHED` để tránh gọi API thừa. [Supabase nêu lỗi deadlock này](https://supabase.com/kb/troubleshooting/why-is-my-supabase-api-call-not-returning-PGzXw0).
- `node scripts/smoke-local-auth.mjs` chạy lại **exit 0**; `npm test` **52/52 qua**, `npm run lint` không cảnh báo, `npm run build` qua với cấu hình Supabase thật (JS 131,31 kB gzip). `git diff --check` sạch. T-01.1 và T-01.3 đạt tiêu chí; T-01.4–01.7 còn mở.

## Gia cố bảo mật và hiệu năng theo yêu cầu — 10/11/2026

**Tiếp tục kiểm tra:** Đã sửa phản hồi API lịch đến sai thứ tự khi chuyển tuần/tháng nhanh: chỉ cửa sổ đang xem được cập nhật lên màn hình. Test hồi quy qua. `npm test` hiện **52/52 qua** ở 17 file; `npm run lint` không cảnh báo, `npm run build` qua. Smoke Auth/RLS/API local chạy lại **exit 0** và dọn tài khoản thử. Ảnh mobile chụp bằng cờ `--window-size` đơn thuần bị cắt vì Chrome áp viewport tối thiểu 500px; ảnh đó đã bỏ và được thay bằng ảnh CDP đặt viewport thật 390px ở mục trên.

- Auth: trang riêng chỉ mở sau `getUser()` xác minh tài khoản; không tin riêng ID từ session lưu trong trình duyệt. Sự kiện làm mới token không gây tải lại dữ liệu. RLS trên database vẫn là lớp phân quyền chính.
- Cache: `sessionStorage` lưu danh sách học sinh và các cửa sổ lịch theo ID giáo viên, TTL 5 phút; gộp các lượt đọc đồng thời; xóa khi đăng xuất, hết phiên/không xác minh được tài khoản hoặc đổi tài khoản; vô hiệu sau tạo/sửa/xóa. Khi trình duyệt chặn storage, app tiếp tục đọc API. Dữ liệu tài chính chưa được cache. Cache giảm request trong cùng tab, không bảo đảm đồng bộ tức thời với tab/thiết bị khác trong tối đa 5 phút.
- API: học sinh kèm lịch sử giá được đọc bằng một truy vấn; lịch chỉ hỏi khoảng thời gian đang xem thay vì toàn bộ lịch. Thêm `planned_end_at` và chỉ mục để lọc buổi giao với khoảng xem, kể cả buổi qua nửa đêm. Kiểm tra số VND trước khi chuyển `bigint` sang JavaScript `number`.
- Giao diện: bỏ transform trang trí; rà mã hiện tại không thấy animation, transition, transform hay timer tạo chuyển động.
- Mốc kiểm tra trước khi sửa phản hồi lịch đến sai thứ tự: `npm test` **51/51 qua** ở 17 file, `npm run lint` **exit 0, không cảnh báo**, `npm run build` **exit 0**. SQL local **67/67 qua** và smoke Auth A/B/RLS/API **exit 0** tại Phiên 1.1, chưa thay SQL từ lần đó. `git diff --check` sạch.
- Còn lại: chưa thử thao tác ghi học sinh/lịch đầu cuối trong trình duyệt và trên thiết bị vật lý; chưa đo hiệu năng với dữ liệu lớn; chưa thiết lập HTTPS/CSP/header bảo mật cho môi trường triển khai, backup/khôi phục; các chức năng tài chính giai đoạn 2–4 chưa xây.

## Phiên 1.1 — 10/11/2026

- Xác nhận migration `202611100008_defer_participant_student_fk.sql` và test `007_teacher_cleanup.sql` đã có trong workspace giải quyết quan hệ xóa giáo viên có lịch. Test cũng xác nhận không xóa cứng học sinh còn gắn lịch khi giáo viên đang hoạt động.
- `npx supabase test db`: **67/67 qua**. `node scripts/smoke-local-auth.mjs`: **exit 0**, gồm đăng nhập A/B, RLS, lịch nhóm, sửa/xóa mềm, audit và dọn tài khoản thử.
- `npx supabase db reset`: **exit 0**, áp dụng đủ 8 migration từ database local; sau reset, SQL test lại **67/67 qua** và smoke API lại **exit 0**.
- Supabase CLI cần `SUPABASE_TELEMETRY_DISABLED=1` và quyền gọi Docker ngoài sandbox; các lệnh đã chạy được sau khi cấp quyền thực thi cần thiết. Không ghi khóa hoặc token vào repository.
- Lỗi dọn tài khoản có lịch đã được kiểm tra lại là hết trong môi trường local. Chưa thay đổi trạng thái nghiệm thu T-01.1 vì còn kiểm tra giao diện ở Phiên 1.4.

## Review theo yêu cầu người dùng — 10/11/2026 (mốc trước Phiên 1.1)

Các kết quả 60/60, lỗi dọn tài khoản và cảnh báo lint dưới đây là ảnh chụp tại thời điểm review ban đầu. Trạng thái mới nhất nằm ở hai mục phía trên.

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
   Các thay đổi sau commit nền hiện chưa được commit; tạo mốc khôi phục sau khi kiểm tra lại.
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

- Giai đoạn 2–4 chờ người dùng đồng ý tiếp tục sau review giai đoạn 1; giai đoạn 5 (phát hành) chưa được giao. Chưa có bản xuất file hay triển khai.

## Hoàn thành — T-01.1

- Đã khởi tạo Git trên nhánh `feature/giai-doan-1`, tạo Vite/React/TypeScript, giao diện khung hồng pastel và hướng dẫn chạy/cấu hình mẫu.
- Mốc ban đầu: `npm test` 22/22 qua trước khi bổ sung Auth, học sinh, lịch và migration; kết quả kiểm tra mới hơn nằm ở phần review trên.
- Đã kiểm tra bằng Chrome headless thật trên desktop 1440px và viewport mobile 390px; ảnh ở mục kiểm tra trình duyệt phía trên. Không có tràn ngang, chữ/nút chính đọc được; `npm run build` qua.

## Hoàn thành — T-01.2

- Đã tạo sáu bảng nền, khóa ngoại cùng chủ sở hữu, RLS và RPC tạo/sửa/xóa mềm lịch trong migration. Đăng ký công khai đã tắt trong cấu hình Auth local.
- Ngày 10/11/2026: `npx supabase db reset` dựng lại database từ đủ tám migration; SQL test 67/67 qua và smoke Auth/RLS/API chạy lại qua.

## Hoàn thành — T-01.3

- Chrome headless đăng nhập bằng tài khoản giáo viên thử local, chỉ thấy An/Bình và lịch của chính tài khoản đó, đăng xuất quay về form và xóa cache riêng tư. Test component chặn trang khi chưa xác minh và SQL/API RLS A/B đã qua. Tài khoản thử được dọn sau khi chạy.

## Lỗi và rủi ro đã biết

| Mục | Trạng thái | Hướng xử lý |
|---|---|---|
| Gói hosting/database miễn phí | Quota và điều khoản có thể thay đổi. | Kiểm tra lại tài liệu chính thức trước khi triển khai và dùng dữ liệu thật. |
| Chưa có backup dữ liệu thật | Chưa có dữ liệu thật nên chưa có bản sao lưu. | Làm T-04.4 và thử khôi phục trước khi nhập dữ liệu thật. |

## Bước tiếp theo

1. Chờ người dùng duyệt giai đoạn 2; khi được đồng ý, bắt đầu phiên 2.1 về xác nhận thực học và tiền từng em.
2. Trước khi dùng dữ liệu thật hoặc phát hành, thử dữ liệu lớn, phân trang/truy vấn, HTTPS/CSP và backup/khôi phục theo các task tương ứng.
