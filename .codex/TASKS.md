# TASKS — Danh sách việc theo thứ tự

**Quy ước:** `[ ]` chưa nghiệm thu, `[x]` đã nghiệm thu và có bằng chứng trong [PROGRESS.md](PROGRESS.md). Mỗi task ghi kết quả có thể xem, cách kiểm tra và phụ thuộc. Trạng thái mã và kiểm thử cập nhật tại [PROGRESS.md](PROGRESS.md); chưa có bản phát hành.

## Review tiến độ — 10/11/2026

**Tỷ lệ nghiệm thu giai đoạn 1–4: 1/20 task = 5%.** Đây là tỷ lệ theo dấu `[x]`, không phải tỷ lệ dòng mã đã viết. Giai đoạn 0 đã xong 3/3; nếu tính cả giai đoạn 0 thì 4/23 task = 17,4%. Không đánh dấu thêm task chỉ vì đã có giao diện hoặc logic mẫu.

| Nhóm | Trạng thái qua review | Việc còn lại để nghiệm thu |
|---|---|---|
| T-01.1 | Có khung React/Vite, build thành công. | Mở và kiểm tra trực quan trên điện thoại, máy tính; sửa bố cục nếu cần. |
| T-01.2 | Đã nghiệm thu migration/RLS nền; SQL test gần nhất 60/60. | Sửa lỗi xóa tài khoản thử sau khi đã tạo lịch; chạy lại kiểm thử toàn bộ. |
| T-01.3 | Có trang đăng nhập, đăng xuất, guard; test component và API Auth A/B đã qua. | Kiểm tra trọn luồng trên trình duyệt với tài khoản thật local trước khi đánh dấu. |
| T-01.4 | Có trang học sinh, RPC tạo học sinh/giá, lịch sử giá; test đơn giá riêng đã qua. | Kiểm tra sửa hồ sơ/thêm giá qua API và UI; hiển thị đúng giá **đang có hiệu lực** thay vì giá mới nhất trong tương lai. |
| T-01.5–01.6 | Có form lịch nhóm, RPC tạo/sửa/xóa mềm, chế độ lọc ngày/tuần/tháng và cảnh báo trùng; test UI/API một phần đã qua. | Chạy luồng UI đầu cuối, kiểm tra xóa mềm/audit và chế độ xem trên hai kích thước; xử lý lỗi dọn tài khoản thử. |
| T-02–04 | Mới có hàm thuần và test đơn vị cho tiền, giá, tham gia, kỳ tháng, tổng kết. | Chưa có migration/chốt buổi/thanh toán/báo cáo thực tế, XLSX, PDF, sao lưu và thử khôi phục. |

**Thứ tự xử lý sau review:** (1) chẩn đoán và sửa lỗi xóa tài khoản thử có lịch, thêm test hồi quy; (2) hoàn tất kiểm thử đầu cuối và giao diện giai đoạn 1, sửa giá hiệu lực và 4 cảnh báo lint; (3) làm tuần tự giai đoạn 2, 3, 4 theo các task bên dưới. Lần kiểm thử tổng mới nhất bị sandbox chặn `spawn EPERM`; lần chạy với quyền cần thiết bị hệ thống auto-review từ chối vì giới hạn sử dụng, nên không coi đó là test sản phẩm thất bại. Chi tiết ở [PROGRESS.md](PROGRESS.md).

## Kế hoạch chia phiên — đã được duyệt 10/11/2026

Đã chia 20 task giai đoạn 1–4 thành **15 phiên** trong [kế hoạch phiên 10/11/2026](../docs/superpowers/plans/2026-11-10-cac-phien-giai-doan-1-4.md). Phase 1 có 4 phiên (sửa nền, Auth/học sinh, lịch, review); phase 2 có 3 phiên (chốt tiền, hủy/bù, review); phase 3 có 4 phiên (giao dịch, báo cáo, giao diện thanh toán, review); phase 4 có 4 phiên (mẫu xuất/XLSX, PDF, khôi phục, review). Mỗi phiên chỉ cập nhật các task gốc khi đã đạt tiêu chí.

**Điểm dừng:** Người dùng đã đồng ý bắt đầu kế hoạch ngày 10/11/2026. Phiên 1.1 đã được kiểm tra; tiếp tục các phiên còn lại của phase 1. Sau review mỗi phase, trình kết quả và chờ đồng ý để sang phase kế tiếp.

## Giai đoạn 0 — Chốt tài liệu và quy tắc

- [x] **T-00.1 — Tạo bộ sáu tài liệu nền.** Bàn giao `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `RULES.md`, `TASKS.md`, `PROGRESS.md`. Kiểm tra: đủ file và nội dung không mâu thuẫn về học nhóm, lịch chồng giờ, đơn giá riêng, tài khoản giáo viên. Phụ thuộc: prompt và kế hoạch đã chú thích.
- [x] **T-00.2 — Chốt các mặc định nghiệp vụ còn mở trong PRD mục 8.** Ghi quyết định có ngày vào `docs/decisions.md` khi bắt đầu mã. Kiểm tra: xử lý phí nghỉ, giá mới, tiền dư, thời gian riêng trong nhóm và xóa lịch dự kiến đã rõ. Phụ thuộc: T-00.1.
- [x] **T-00.3 — Duyệt phạm vi giai đoạn 1.** Kiểm tra: giáo viên xác nhận bản đầu gồm đăng nhập, học sinh/giá, lịch nhóm, sửa/xóa lịch và cảnh báo trùng; học phí/xuất file thuộc giai đoạn sau. Phụ thuộc: T-00.1; có thể chốt cùng T-00.2.

## Giai đoạn 1 — Bản lịch chạy local

- [ ] **T-01.1 — Khởi tạo dự án React/Vite/TypeScript.** Bàn giao app chạy local với layout nền hồng pastel theo `DESIGN.md`, cấu hình môi trường mẫu và hướng dẫn chạy. Kiểm tra: mở trên điện thoại và máy tính, chữ/nút rõ, build thành công. Phụ thuộc: T-00.3.
- [x] **T-01.2 — Thiết kế migration và RLS nền.** Tạo `profiles`, `students`, `rate_history`, `sessions`, `session_students`, `audit_events` với ràng buộc sở hữu. Kiểm tra: tài khoản A không đọc/ghi dữ liệu B; không ghép học sinh B vào buổi A. Phụ thuộc: T-01.1.
- [ ] **T-01.3 — Đăng nhập chỉ cho giáo viên.** Bàn giao màn hình đăng nhập, đăng xuất, chặn trang riêng khi chưa đăng nhập. Kiểm tra: người chưa đăng nhập không thấy dữ liệu; sau đăng nhập thấy đúng dữ liệu mình. Phụ thuộc: T-01.2.
- [ ] **T-01.4 — Quản lý học sinh và đơn giá.** Tạo/sửa hồ sơ, giá VND/giờ và ngày hiệu lực, xem lịch sử. Kiểm tra: An 100.000đ/giờ, Bình 120.000đ/giờ hiển thị tách biệt; giá không âm. Phụ thuộc: T-01.3.
- [ ] **T-01.5 — Tạo/sửa/xóa ghi chú lịch.** Chọn một hoặc nhiều học sinh, ngày/giờ, 30/60/90/120 phút hoặc nhập phút khác, hình thức và địa điểm/link. Xóa mềm lịch chưa chốt. Kiểm tra: An+Bình 18:00–19:30 nằm trong một mục; sửa thành 19:00; xóa thì không còn ở lịch thường nhưng còn dấu vết. Phụ thuộc: T-01.4.
- [ ] **T-01.6 — Lịch ngày/tuần/tháng và cảnh báo trùng.** Hiển thị lịch nhóm và mục riêng; cảnh báo trùng không chặn. Kiểm tra: thêm mục 18:30–19:30 khi đã có 18:00–19:00, thấy cảnh báo đúng khoảng giờ và vẫn lưu được. Phụ thuộc: T-01.5.
- [ ] **T-01.7 — Review giai đoạn 1.** Kiểm tra luồng từ đăng nhập đến quản lý lịch trên điện thoại/máy tính; kiểm thử RLS, trạng thái lịch 0đ và giao diện hồng pastel dễ đọc theo `DESIGN.md`. Ghi lỗi và kết quả trong `PROGRESS.md`. Phụ thuộc: T-01.1 đến T-01.6.

**Bàn giao giai đoạn 1:** App chạy local và dữ liệu thử, chỉ giáo viên thao tác; học phí tháng và xuất file chưa có.

## Giai đoạn 2 — Xác nhận học và học phí từng em

- [ ] **T-02.1 — Trạng thái tham gia từng học sinh.** Xác nhận đã học/nghỉ/hủy cho từng em; nhập giờ bắt đầu và phút thực học riêng, có nút áp dụng chung cho nhóm. Kiểm tra: trong buổi An+Bình, An học 90 phút còn Bình nghỉ thì chỉ An được chốt học. Phụ thuộc: T-01.7, T-00.2.
- [ ] **T-02.2 — Tính và chốt tiền.** Dùng đơn giá có hiệu lực hoặc giá riêng có lý do; lưu snapshot và tính số nguyên VND từng dòng. Kiểm tra: An 100.000đ × 90 phút = 150.000đ; Bình 120.000đ × 90 phút = 180.000đ; lịch `scheduled` = 0đ; 100.001đ × 30 phút = 50.001đ. Phụ thuộc: T-02.1.
- [ ] **T-02.3 — Hủy, dạy bù, sửa sau chốt và audit.** Dạy bù liên kết đúng em cần bù; thay tiền có lý do và điều chỉnh. Kiểm tra: một em nghỉ không hủy tiền em khác; buổi bù chỉ đếm một lần; buổi đã thu không xóa cứng. Phụ thuộc: T-02.2.
- [ ] **T-02.4 — Review giai đoạn 2.** Kiểm thử giá đổi giữa tháng, phút thực tế khác dự kiến, học nhóm, qua nửa đêm và sửa đã chốt. Phụ thuộc: T-02.1 đến T-02.3.

## Giai đoạn 3 — Tổng kết tháng và thanh toán

- [ ] **T-03.1 — Tổng kết từng học sinh.** Lọc kỳ theo giờ bắt đầu thực tế tại Việt Nam; hiện các dòng, phút, giá, tiền. Kiểm tra: không cộng tiền Bình vào An; buổi bắt đầu 30/11 và kết thúc 01/12 thuộc tháng 11. Phụ thuộc: T-02.4.
- [ ] **T-03.2 — Tổng quan mọi học sinh.** Hiện số buổi, phút, phải thu, đã thu, còn thu từng em và tổng. Kiểm tra: tổng danh sách khớp cộng từng báo cáo. Phụ thuộc: T-03.1.
- [ ] **T-03.3 — Giao dịch thanh toán và điều chỉnh.** Ghi nhiều khoản nhận/hoàn theo em và kỳ; không âm thầm sửa lịch sử. Kiểm tra: An phải thu 320.000đ, đã nhận 200.000đ, còn 120.000đ. Phụ thuộc: T-03.1.
- [ ] **T-03.4 — Review giai đoạn 3.** Đối soát tiền và RLS cho dữ liệu tháng/thanh toán; xử lý tình huống điều chỉnh sau khi đã thu. Phụ thuộc: T-03.2, T-03.3.

## Giai đoạn 4 — Xuất báo cáo và sao lưu

- [ ] **T-04.1 — Mẫu dữ liệu xuất chung.** Một bộ dữ liệu chuẩn cho màn hình, XLSX và PDF. Kiểm tra: mọi dòng và tổng giống nhau. Phụ thuộc: T-03.4.
- [ ] **T-04.2 — Xuất XLSX.** Giữ cột số tiền kiểu số, định dạng VND và ngày Việt Nam. Kiểm tra: mở file, cộng cột tiền được, tiếng Việt đúng. Phụ thuộc: T-04.1.
- [ ] **T-04.3 — Xuất PDF.** Font Unicode, bố cục dùng được trên điện thoại và giấy A4. Kiểm tra: dấu tiếng Việt và tổng tiền khớp XLSX/màn hình. Phụ thuộc: T-04.1.
- [ ] **T-04.4 — Sao lưu/xuất dữ liệu và thử khôi phục.** Viết hướng dẫn vận hành và phục hồi bộ dữ liệu thử. Kiểm tra: dữ liệu học sinh, lịch, giá và thanh toán sau khôi phục đối soát được. Phụ thuộc: T-03.4.
- [ ] **T-04.5 — Review giai đoạn 4.** So sánh 3 nơi hiển thị, kiểm tra bảo mật file và khả năng khôi phục. Phụ thuộc: T-04.2 đến T-04.4.

## Giai đoạn 5 — Phát hành và cải tiến

- [ ] **T-05.1 — Chuẩn bị môi trường triển khai.** Kiểm tra điều khoản/quota hiện hành, cấu hình Auth, khóa công khai, RLS, URL và HTTPS. Phụ thuộc: T-04.5.
- [ ] **T-05.2 — Phát hành web và kiểm tra thực tế.** Thử đăng nhập, lịch, học phí, xuất file trên điện thoại và máy tính; theo dõi quota và lịch sao lưu. Phụ thuộc: T-05.1 và chỉ thực hiện khi việc phát hành đã được người dùng giao/duyệt.
- [ ] **T-05.3 — Đánh giá mở rộng.** Xem nhu cầu PWA, lịch lặp và đồng bộ khi mất mạng; tạo task riêng khi có nhu cầu. Phụ thuộc: T-05.2.

## Quy tắc cập nhật task

Sau mỗi task, đánh dấu `[x]` khi đã quan sát tiêu chí nghiệm thu và cập nhật `PROGRESS.md` với ngày, thay đổi, kiểm tra và lỗi còn lại. Nếu yêu cầu người dùng đổi, sửa ID/nội dung task liên quan trước khi tiếp tục; không đánh dấu xong chỉ vì đã tạo file hoặc viết mã mà chưa kiểm tra.
