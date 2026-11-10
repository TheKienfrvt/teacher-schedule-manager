# RULES — Quy tắc xây dựng dự án

**Phạm vi:** Hướng dẫn cho người và AI khi viết mã trong dự án này. **Ưu tiên:** yêu cầu mới nhất của người dùng → [PRD.md](PRD.md) cho nghiệp vụ → [ARCHITECTURE.md](ARCHITECTURE.md) cho kỹ thuật → [DESIGN.md](DESIGN.md) cho giao diện → [TASKS.md](TASKS.md) cho thứ tự → [PROGRESS.md](PROGRESS.md) cho trạng thái thực tế. Khi tài liệu mâu thuẫn, sửa tài liệu liên quan cùng với thay đổi đã được chốt; không âm thầm chọn một cách hiểu khác.

## 1. Trước khi làm một task

1. Đọc yêu cầu mới nhất và task tương ứng; kiểm tra phần phụ thuộc đã hoàn thành chưa.
2. Xác định thay đổi thuộc nghiệp vụ tiền, quyền truy cập, giao diện hay hạ tầng; đọc đúng file liên quan.
3. Với quy tắc chưa được chốt trong PRD, áp dụng mặc định đã ghi nếu phù hợp yêu cầu hiện tại; nêu rõ giả định trong kết quả và cập nhật `docs/decisions.md` khi quyết định được xác nhận.
4. Chỉ sửa phần cần thiết cho task, nhưng hoàn thành cả luồng sử dụng có thể kiểm tra được. Cập nhật `PROGRESS.md` bằng kết quả thực tế sau khi làm.

## 2. Quy tắc viết mã

- Dùng TypeScript có kiểu rõ ràng; tránh `any` ở nghiệp vụ tiền, thời gian, trạng thái và dữ liệu Supabase.
- Tách `sessions` (ghi chú lịch) và `session_students` (thực học/tiền từng em). Không dùng một trường `student_id` duy nhất ở mục lịch nhóm.
- Một học sinh có giá riêng. Tiền theo số nguyên VND và phút nguyên; dùng công thức đã duyệt, làm tròn từng em/từng lần học. Không cộng tiền bằng số thực hoặc tính từ thời lượng dự kiến.
- Mục lịch dự kiến có tiền bằng 0; chỉ xác nhận học mới chốt tiền. Cảnh báo chồng giờ là cảnh báo, không phải lỗi chặn lưu.
- Lưu thời điểm nhất quán; định dạng và xác định tháng theo `Asia/Ho_Chi_Minh`. Viết kiểm thử cho ranh giới cuối tháng, qua nửa đêm và học nhóm.
- Giữ giá đã chốt của buổi cũ khi đổi giá. Chỉnh dữ liệu tài chính đã chốt phải có lý do, dấu vết và tính lại báo cáo liên quan.
- Cấu trúc database thay đổi qua migration có phiên bản; chính sách RLS và kiểm thử quyền đi cùng migration.
- Tái sử dụng component theo `DESIGN.md`; văn bản giao diện bằng tiếng Việt, trạng thái có cả chữ và màu, biểu mẫu dùng được bằng bàn phím.
- Mỗi thay đổi có rủi ro phải được kiểm tra bằng ví dụ thực tế trong `TASKS.md`; kiểm tra đúng vùng ảnh hưởng trước khi mở rộng phạm vi kiểm thử.

## 3. Những điều AI tuyệt đối không được làm

- **Không tự đổi quy tắc học phí đã chốt** hoặc tự tạo phí hủy, làm tròn, thu tiền ứng trước ngoài quyết định đã ghi.
- **Không tính tiền cho lịch chưa diễn ra**; không gộp tiền nhiều học sinh trong một buổi thành một khoản không thể tách.
- **Không chặn lưu lịch chỉ vì trùng giờ**; không tự gộp hai mục lịch chồng giờ thành một buổi.
- **Không cấp quyền đăng nhập cho học sinh/phụ huynh** khi chưa có yêu cầu mới của người dùng.
- **Không xóa cứng buổi/giao dịch đã tính tiền** hoặc sửa số đã nhận mà không có dấu vết; xóa lịch chưa chốt phải theo quy tắc ẩn có lưu lịch sử.
- **Không đưa service role key, mật khẩu, token, dữ liệu học sinh thật hoặc file báo cáo thật vào repository, log, ảnh chụp hay frontend**.
- **Không dựa riêng vào ẩn nút UI để bảo vệ dữ liệu**; quyền phải được kiểm tra ở database/RLS.
- **Không ghi “đã hoàn thành”, “đã kiểm thử” hoặc “đã triển khai” trong `PROGRESS.md` nếu chưa thực hiện và quan sát kết quả**.
- **Không tự tuyên bố gói miễn phí bảo đảm 0đ lâu dài**; kiểm tra quota và điều khoản hiện hành khi chuẩn bị triển khai.

## 4. Cách review và bàn giao

Một task chỉ được đánh dấu `done` khi có: thay đổi xem lại được, tiêu chí nghiệm thu đã kiểm tra, kết quả kiểm tra được ghi rõ, lỗi còn lại được ghi trong `PROGRESS.md`. Với logic tiền và RLS, cần ít nhất một trường hợp thành công và một trường hợp dễ sai. Với UI, xem cả điện thoại và máy tính. Với file xuất, so sánh số liệu màn hình–XLSX–PDF và dấu tiếng Việt.

Các quyết định còn mở trong PRD không ngăn việc làm phần độc lập, nhưng không được giấu giả định. Khi người dùng sửa yêu cầu, cập nhật các tài liệu bị ảnh hưởng trước hoặc cùng lúc với mã tương ứng. Đây là quy tắc đồng bộ tài liệu, không phải yêu cầu xác nhận lại cho những việc người dùng đã giao.
