# PRD — Ứng dụng quản lý lịch dạy và học phí

**Trạng thái:** Bản đặc tả để triển khai theo giai đoạn · **Ngày:** 09/11/2026
**Nguồn:** [Prompt gốc](../PROMPT_Codex_ke_hoach_app_lich_hoc_hoc_phi.md) · [Kế hoạch đã chú thích](../KE_HOACH_PHAT_TRIEN_APP_LICH_HOC_HOC_PHI.md)

## 1. Sản phẩm và người dùng

Ứng dụng web giúp **một giáo viên/gia sư** ghi lịch học, xác nhận thời gian đã học, theo dõi học phí từng học sinh theo tháng và tải bảng kê Excel/PDF. Giáo viên thao tác toàn bộ. **Học sinh và phụ huynh không có tài khoản**; giáo viên tự gửi file cho phụ huynh.

Đây là sản phẩm **dành tặng bạn gái của người đặt hàng**; giao diện cần hồng pastel dịu, dễ thương và vẫn rõ ràng cho việc xem lịch, giờ và tiền. Quy chuẩn cụ thể ở [DESIGN.md](DESIGN.md).

Một mục lịch có thể chứa **một hoặc nhiều học sinh**. Các mục lịch riêng có thể chồng giờ; ứng dụng cảnh báo nhưng cho giáo viên quyết định lưu. Mỗi học sinh có đơn giá VND/giờ riêng và có thể có thời gian thực học khác các em trong cùng buổi.

## 2. Vấn đề cần giải quyết

- Lịch thay đổi do việc đột xuất; giáo viên cần sửa/xóa ghi chú lịch dự kiến nhanh, kể cả trên điện thoại.
- Lịch mới là **ghi chú ai dự kiến học lúc nào**, chưa phải buổi đã học và chưa phát sinh tiền.
- Cuối tháng cần biết từng em đã học ngày nào, từ giờ nào đến giờ nào, bao nhiêu phút, trực tiếp hay online, giá và số tiền từng lần.
- Giá thay đổi theo thời gian nhưng buổi đã chốt phải giữ giá khi học; thanh toán có thể nhận nhiều lần.
- Bảng kê và dữ liệu học sinh phải được bảo vệ, xuất được tiếng Việt và có phương án sao lưu.

## 3. Kết quả mong muốn và giới hạn

| Mục tiêu đo được | Điều kiện đạt |
|---|---|
| Ghi lịch nhanh | Tạo mục lịch với 1 hoặc nhiều em, ngày/giờ bắt đầu và lựa chọn 30/60/90/120 phút hoặc nhập phút khác; giờ kết thúc tự tính. |
| Xử lý thay đổi | Sửa/xóa được mục lịch chưa chốt; mục bị xóa biến mất khỏi lịch thông thường nhưng có dấu vết. |
| Quản lý trùng giờ | Cảnh báo tên và khoảng giờ trùng; vẫn lưu được nếu giáo viên xác nhận ý định. |
| Tính tiền đúng từng em | Chỉ dòng tham gia đã xác nhận thực học mới có học phí; giá và phút của em nào dùng cho em đó. |
| Tổng kết tháng | Tổng dòng học đã chốt, số lần học, phút học, tổng phải thu, đã thu, còn thu của từng em và tổng quan cả lớp. |
| Xuất bảng kê | XLSX và PDF có dấu tiếng Việt, kỳ tháng, chi tiết buổi, tổng, thanh toán; số liệu khớp màn hình. |

**Ngoài phạm vi bản đầu:** Tài khoản học sinh/phụ huynh, nhiều giáo viên cùng chia sẻ một lớp, thu tiền trực tuyến, nhắc lịch tự động, lịch lặp, PWA và chỉnh sửa khi mất mạng. Hình thức học **trực tiếp/online** là thuộc tính buổi học, không có nghĩa app dùng được khi mất mạng.

## 4. Luồng người dùng

1. Giáo viên đăng nhập, tạo hồ sơ học sinh và đơn giá riêng, có ngày hiệu lực.
2. Giáo viên ghi mục lịch cho một hoặc nhiều em; có thể thêm mục khác trùng giờ sau khi xem cảnh báo.
3. Trước khi học, giáo viên có thể sửa/xóa mục lịch hoặc chuyển sang buổi dạy bù khi kế hoạch thay đổi.
4. Sau giờ học, giáo viên đánh dấu từng em đã học/nghỉ, nhập giờ bắt đầu và số phút thực tế; có thao tác áp dụng cùng thời gian cho cả nhóm rồi sửa riêng nếu cần.
5. Ứng dụng chốt giá và tiền cho từng em. Giá cũ không tự thay đổi khi cập nhật đơn giá mới.
6. Cuối tháng, giáo viên xem bảng kê từng em, ghi từng khoản đã nhận, kiểm tra số còn thu và tải XLSX/PDF để tự gửi.

## 5. Yêu cầu chức năng

| ID | Yêu cầu | Ưu tiên | Nghiệm thu chính |
|---|---|---|---|
| FR-01 | Chỉ giáo viên đăng nhập và quản lý dữ liệu thuộc mình | MVP | Tài khoản A không xem/sửa dữ liệu của B; không có màn hình đăng nhập cho học sinh. |
| FR-02 | Hồ sơ học sinh và lịch sử đơn giá từng em | MVP | Đổi giá của An không đổi giá buổi đã chốt. |
| FR-03 | Lịch ngày/tuần/tháng, lọc học sinh | MVP | Một buổi nhóm hiển thị tên các em; mục riêng chồng giờ cùng hiển thị. |
| FR-04 | Tạo/sửa/xóa mục lịch dự kiến, chọn nhiều em, giờ kết thúc tự tính | MVP | Lịch 18:00 + 90 phút hiện 19:30; xóa lịch chưa chốt khỏi chế độ xem thường. |
| FR-05 | Cảnh báo chồng giờ, không chặn lưu | MVP | Mục 18:30–19:30 chồng mục 18:00–19:00 hiện cảnh báo và vẫn có thể lưu. |
| FR-06 | Xác nhận thực học/nghỉ theo từng em, thời gian thực tế, hủy và dạy bù | MVP | An học 90 phút, Bình nghỉ trong cùng buổi: chỉ An phát sinh tiền. |
| FR-07 | Tính tiền nguyên VND từng em; sửa sau chốt có lý do và dấu vết | MVP | 100.000đ/giờ × 90 phút = 150.000đ; lịch chưa học = 0đ. |
| FR-08 | Tổng kết tháng từng em và tổng quan | MVP | Số dòng, phút và tiền khớp các lần học đã xác nhận. |
| FR-09 | Ghi thanh toán từng phần và khoản hoàn trả/điều chỉnh | MVP | Phải thu 320.000đ, nhận 200.000đ → còn 120.000đ. |
| FR-10 | Xuất bảng kê XLSX/PDF | MVP | File mở được, có đủ dấu tiếng Việt và giá trị khớp màn hình. |
| FR-11 | Sao lưu/xuất dữ liệu và thử khôi phục | Trước dữ liệu thật | Khôi phục thành công bộ dữ liệu mẫu trên môi trường thử. |

## 6. Quy tắc học phí mặc định

- Mục lịch `scheduled` không tạo khoản phải thu. Một mục lịch nhóm có một dòng tham gia cho mỗi học sinh.
- Chỉ dòng của em được xác nhận **đã học** mới dùng phút thực học để tính: `floor((đơn_giá_vnd_mỗi_giờ × phút_thực_học + 30) / 60)`. Làm tròn nửa VND lên, **theo từng em/từng buổi**, rồi mới cộng tháng. Tiền và phút là số nguyên.
- Đơn giá có ngày hiệu lực. Khi chốt, lưu bản chụp đơn giá trong dòng của học sinh. Giá cũ không đổi khi cập nhật giá hiện hành. Có thể chốt giá riêng nhưng phải ghi lý do.
- Hủy/nghỉ có báo trước: mặc định 0đ. Nghỉ sát giờ: không tự thu; nếu có thỏa thuận, giáo viên nhập khoản điều chỉnh có lý do. Dạy bù tạo buổi mới liên kết với dòng cũ và tính vào kỳ của ngày học bù.
- Mỗi dòng học thuộc tháng của **giờ bắt đầu thực học của chính em đó** tại `Asia/Ho_Chi_Minh`; buổi qua nửa đêm không bị chia tiền. Giao dịch thanh toán gắn kỳ tháng và học sinh.
- Sửa/xóa dữ liệu đã chốt không được âm thầm làm mất lịch sử. Ghi người sửa, thời gian, lý do và khoản điều chỉnh nếu ảnh hưởng tiền.

## 7. Báo cáo tối thiểu

Mỗi báo cáo của **một học sinh trong một tháng** có: tên giáo viên, tên học sinh, kỳ tháng/năm, ngày xuất; từng dòng gồm ngày học, giờ bắt đầu/kết thúc, phút, hình thức, đơn giá, thành tiền, ghi chú/dạy bù; cuối bảng gồm số lần học, tổng phút/giờ, tiền học, điều chỉnh, tổng phải thu, đã thu, còn phải thu và trạng thái thanh toán. Buổi học nhóm xuất hiện trong báo cáo từng em với **giá và thời lượng của em đó**.

## 8. Quyết định cần chốt trước phần tiền

Các mục dưới đây đã được người dùng **đồng ý ngày 09/11/2026**; xem [quyết định](../docs/decisions.md) và chi tiết trong [kế hoạch](../KE_HOACH_PHAT_TRIEN_APP_LICH_HOC_HOC_PHI.md):

1. Học nhóm cho phép thời gian thực học riêng từng em; có nút áp dụng chung.
2. Nghỉ sát giờ không tự thu phí; khoản phí đặc biệt nhập thủ công và có lý do.
3. Giá mới có ngày hiệu lực do giáo viên chọn; buổi chưa học dùng giá có hiệu lực lúc thực học.
4. Bản đầu chưa nhận tiền ứng trước/vượt phải thu của kỳ tháng.
5. Xóa lịch dự kiến là ẩn có lưu dấu vết; buổi đã tính tiền không xóa cứng.

## 9. Mốc bàn giao

Giai đoạn 1 là bản chạy local: giáo viên đăng nhập, quản lý học sinh và đơn giá, lịch ngày/tuần/tháng, chọn nhiều em, sửa/xóa lịch dự kiến, cảnh báo trùng không chặn và chính sách cô lập dữ liệu. Các giai đoạn tiếp theo và thứ tự chi tiết nằm ở [TASKS.md](TASKS.md). Chưa có chức năng nào được triển khai tại thời điểm tạo PRD này.
