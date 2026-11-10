# DESIGN — Định hướng giao diện

**Trạng thái:** Bản thiết kế nền để review, chưa có màn hình được lập trình · **Nguồn:** [PRD.md](PRD.md)

## 1. Phong cách

Giao diện mang cảm giác **một món quà dành tặng bạn gái**: hồng pastel dịu, mềm mại, dễ thương và ấm áp. Thẻ bo tròn, khoảng trắng thoáng, icon nét tròn và chi tiết trang trí nhỏ tạo nét riêng; giờ học và học phí vẫn phải dễ đọc trên điện thoại. Trang trí dùng tiết chế ở tiêu đề hoặc trạng thái trống, không đặt sát số tiền hay trong biểu mẫu quan trọng. Màu trạng thái luôn đi kèm chữ hoặc biểu tượng. Văn bản dùng tiếng Việt; ngày `dd/mm/yyyy`, giờ 24 giờ, tiền định dạng `100.000đ`.

## 2. Màu sắc và chữ

| Vai trò | Mã màu đề xuất | Cách dùng |
|---|---|---|
| Nền trang | `#FFF7FA` | Hồng gần trắng, dịu mắt khi xem lịch lâu. |
| Nền bề mặt | `#FFFFFF` | Biểu mẫu, thẻ học sinh, bảng học phí. |
| Hồng phấn nhấn | `#F8DCE8` | Nền tab đang chọn, nhãn lịch dự kiến, chi tiết trang trí nhỏ. |
| Hồng đào phụ | `#FFEAE2` | Mảng nhấn mềm ở trang chào và trạng thái trống. |
| Tím lavender nhạt | `#F1E9FA` | Phân biệt thẻ học nhóm hoặc lớp màu phụ trên lịch. |
| Chữ chính | `#3D2D37` | Tiêu đề, giờ học, số tiền và nội dung chính. |
| Chữ phụ | `#744E60` | Nhãn phụ, ghi chú; vẫn đủ đậm trên nền sáng. |
| Viền | `#EED8E2` | Ranh giới nhẹ cho thẻ, bảng và ô nhập. |
| Hành động chính | `#A04368` với chữ `#FFFFFF` | Hồng rose đậm cho nút Lưu/Xác nhận để chữ dễ đọc; hover `#8C315A`. |
| Thành công/đã học | Chữ `#3F735E` trên nền `#EAF7F1` | Xanh sage dịu giúp phân biệt trạng thái đã học/đã thu; luôn kèm nhãn. |
| Cảnh báo/trùng giờ | Chữ `#915A17` trên nền `#FFF4DF` | Vàng kem ấm, cảnh báo có thể tiếp tục. |
| Lỗi/thao tác nguy hiểm | Chữ `#A83E57` trên nền `#FFF0F2` | Đỏ hồng dịu cho lỗi nhập liệu và xóa lịch, kèm mô tả rõ. |

**Font:** dùng font hệ thống có dấu tiếng Việt (`Segoe UI`, `Arial`, `Roboto`, sans-serif) với tiêu đề hơi tròn và đậm vừa; chưa phụ thuộc dịch vụ font bên ngoài. Thân chữ 16px, nhãn phụ 14px, tiêu đề trang 24–28px. Số tiền dùng chữ số thẳng hàng nếu font hỗ trợ; căn phải trong bảng. Không dùng chữ hồng phấn nhạt cho nội dung quan trọng. Các cặp màu chữ/nền chính ở bảng đạt tỷ lệ tương phản tối thiểu khoảng 5:1 theo phép tính màu; khi làm UI vẫn phải kiểm tra cả trạng thái focus, disabled và kích thước chữ thực tế.

**Hình khối:** thẻ bo góc 16–20px, ô nhập 12px, nút dạng viên mềm; đổ bóng hồng rất nhẹ chỉ để tách lớp, không tạo cảm giác nặng. Icon dạng nét đơn giản, cùng độ dày; một hình trái tim hoặc bông hoa nhỏ có thể xuất hiện ở trang chào/trạng thái trống, không lặp lại trên mọi dòng dữ liệu.

## 3. Bố cục responsive

- **Điện thoại:** một cột trên nền hồng gần trắng; đầu trang có tên màn hình và hành động chính; lịch tháng/tuần có thể chuyển sang danh sách theo ngày; biểu mẫu nằm trong thẻ trắng bo tròn; thanh thao tác dưới màn hình cho Lịch, Học sinh, Tổng kết.
- **Máy tính:** thanh điều hướng hồng phấn rất nhạt bên trái; vùng nội dung chính dùng thẻ trắng; lịch tuần/tháng rộng; bảng tổng kết có cột cố định cho tên học sinh và tổng tiền nếu cần.
- Không đặt thông tin quyết định (giờ, học sinh, tiền, cảnh báo) trong vùng chỉ hiện khi rê chuột. Nút chạm có kích thước đủ lớn; thao tác xóa cần xác nhận rõ đối tượng và hậu quả.

## 4. Thành phần dùng chung

| Component | Nội dung và hành vi |
|---|---|
| `AppShell` | Tiêu đề, điều hướng, menu tài khoản giáo viên, vùng thông báo. |
| `PageHeader` | Tên trang, mô tả ngắn, nút hành động chính. |
| `StudentPicker` | Tìm/chọn một hoặc nhiều học sinh; mỗi em hiển thị đơn giá hiện hành để giáo viên kiểm tra. |
| `DateTimeField` | Chọn ngày và giờ 24 giờ; luôn hiển thị múi giờ Việt Nam. |
| `DurationPicker` | Nút 30/60/90/120 phút + nhập phút khác; hiển thị giờ kết thúc dự kiến tự tính. |
| `ModeField` | Chọn Trực tiếp/Online; hiện địa điểm hoặc liên kết tương ứng. |
| `OverlapWarning` | Danh sách mục lịch bị chồng, học sinh liên quan và khoảng giờ; nút “Sửa giờ” và “Vẫn lưu lịch”. Cảnh báo không tự chặn. |
| `SessionCard` | Giờ, hình thức, danh sách em, trạng thái; đánh dấu “Học nhóm” khi có nhiều em. |
| `AttendanceRow` | Một học sinh trong buổi: đã học/nghỉ, giờ bắt đầu, phút thực học, đơn giá chốt, thành tiền. |
| `MoneySummary` | Tổng phải thu, đã thu, còn phải thu theo kỳ; số tiền nổi bật, giải thích nguồn tổng. |
| `StatusBadge` | Dự kiến, Đã học, Nghỉ, Đã hủy, Thanh toán một phần/đủ; chữ luôn có mặt. |
| `ConfirmDialog` | Xác nhận xóa lịch hoặc điều chỉnh tiền, nêu chính xác học sinh/buổi bị ảnh hưởng. |
| `EmptyState` | Hướng dẫn tạo học sinh/lịch đầu tiên hoặc giải thích tháng chưa có buổi đã học. |

**Áp dụng phong cách cho component:** Nút chính dùng rose đậm và chữ trắng; nút phụ nền hồng phấn với chữ chính; ô nhập có viền hồng nhạt và vòng focus rose rõ. `SessionCard` dùng một dải màu mỏng để phân biệt dự kiến/đã học, còn tên và giờ giữ chữ đậm. `StatusBadge` dùng nền pastel và chữ đậm tương ứng; `OverlapWarning` dùng vàng kem để cảnh báo nổi bật mà không gây căng thẳng. `MoneySummary` đặt số tiền trên nền trắng, không dùng nền hồng đậm phía sau các con số.

## 5. Thiết kế từng màn hình

### Học sinh

Danh sách có tìm kiếm, tên, đơn giá hiện hành, số buổi tháng này và trạng thái. Mỗi học sinh là một thẻ trắng, có dấu nhấn hồng phấn nhỏ thay cho màu khối lớn. Trang chi tiết hiển thị thông tin liên hệ, lịch sử giá, buổi gần đây. Chỉ giáo viên được tạo/sửa; không có hành động dành cho học sinh.

### Lịch học

Có chế độ ngày/tuần/tháng. Mục lịch nhóm có dấu nhấn lavender và nhiều tên trong cùng thẻ; các mục riêng trùng giờ hiện cạnh nhau hoặc xếp theo hàng, **không tự gộp**. Bấm mục lịch mở chi tiết; nút hồng rose “Thêm lịch” luôn dễ tìm. Trạng thái “Dự kiến” màu hồng phấn và “Đã học” màu sage, đều có nhãn chữ.

### Thêm/Sửa mục lịch

Thứ tự trường: học sinh → ngày và giờ bắt đầu → thời lượng → hình thức → địa điểm/link → ghi chú. Sau khi nhập, hiển thị khung giờ kết thúc và cảnh báo chồng giờ. Khi sửa/xóa lịch dự kiến, chỉ hiện tác động đến ghi chú lịch; không hiển thị học phí phải thu.

### Chi tiết buổi và xác nhận thực học

Phần đầu là lịch dự kiến. Bên dưới, mỗi học sinh có một dòng riêng. Nút “Áp dụng cùng thời gian cho cả nhóm” điền nhanh rồi vẫn cho sửa từng em. Chỉ sau khi giáo viên bấm xác nhận mới hiện tiền chốt từng em. Nếu một em nghỉ, dòng em đó không tính học phí và không làm thay đổi dòng em khác.

### Tổng kết tháng và thanh toán

Đầu trang chọn tháng/năm và xem tổng quan mọi học sinh; bấm một em để xem các dòng học. Tiền phải thu, đã thu, còn phải thu hiển thị gần nhau. Thanh toán là danh sách từng lần nhận, có ngày/số tiền/phương thức; thao tác sửa phải ghi lý do. Dòng học nhóm vẫn chỉ tính tiền của học sinh đang xem.

### Xuất báo cáo

Xem trước đúng nội dung XLSX/PDF: tên, kỳ, từng ngày/giờ/phút/hình thức/giá/tiền và dòng tổng. Nút tải từng định dạng; giáo viên tự gửi. Cảnh báo trước khi xuất nếu còn buổi dự kiến trong tháng chưa được xác nhận, nhưng vẫn cho xem dữ liệu đã chốt.

## 6. Trạng thái, lỗi và nội dung chữ

- Thông báo khi tạo lịch: “Đã lưu lịch dự kiến. Chưa tính học phí.”
- Cảnh báo trùng: “Khung giờ này trùng với lịch của … Bạn vẫn có thể lưu.”
- Xác nhận xóa: “Ẩn lịch dự kiến ngày … cho …? Lịch sử thay đổi vẫn được lưu.”
- Sau xác nhận học: “Đã chốt học phí cho An: 150.000đ.” Với nhóm, liệt kê từng em.
- Khi không có dữ liệu tháng: “Tháng này chưa có buổi học đã xác nhận.”
- Lỗi nhập liệu cần chỉ rõ trường và cách sửa, không chỉ báo “Có lỗi xảy ra”.

## 7. Tiêu chí review thiết kế

Xem trên màn hình điện thoại và máy tính; tổng thể phải **hồng pastel nhẹ nhàng, dễ thương** nhưng đọc rõ ngày, giờ, tên em và số tiền. Hoàn thành thao tác tạo lịch nhóm, sửa/xóa lịch dự kiến và xác nhận riêng từng em mà không nhầm trạng thái. Kiểm tra bàn phím, focus, nhãn trường, thông báo lỗi, độ tương phản và PDF tiếng Việt khi các chức năng tương ứng được xây dựng. Hình trang trí không được che hoặc làm phân tán chú ý khỏi dữ liệu học phí.
