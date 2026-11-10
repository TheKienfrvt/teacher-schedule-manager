# Prompt gửi Codex: Lên kế hoạch app lịch học và tính học phí theo tháng

Tôi muốn xây dựng một **web app quản lý lịch dạy, buổi học và học phí** cho gia sư/giáo viên. Trước khi viết mã, hãy đóng vai kiến trúc sư sản phẩm và kỹ sư phần mềm: rà soát yêu cầu, nêu ý kiến về cách làm phù hợp, chỉ ra các quy tắc nghiệp vụ cần chốt, rồi chia công việc thành các giai đoạn nhỏ để tôi duyệt và làm lần lượt.

## Bối cảnh và mục tiêu

- Ban đầu một giáo viên quản lý nhiều học sinh; cần chạy trên trình duyệt máy tính và điện thoại. Có thể nâng thành PWA sau.
- Mỗi buổi học có học sinh, ngày, **giờ bắt đầu**, thời lượng, giờ kết thúc tự tính, hình thức **trực tiếp/online**, địa điểm hoặc liên kết học online, đơn giá theo giờ và tiền buổi học.
- Chọn nhanh 30 phút, 1 giờ, 1 giờ 30 phút, 2 giờ; cho phép nhập thời lượng khác theo phút. Ví dụ: 100.000đ/giờ × 90 phút ÷ 60 = 150.000đ. Tiền phải tính chính xác bằng số nguyên VND, có quy tắc làm tròn rõ ràng nếu cần.
- Lịch có chế độ xem ngày/tuần/tháng, cảnh báo trùng giờ, cho sửa, hủy, dạy bù và ghi nhận **thời lượng thực học** nếu khác lịch dự kiến.
- **Yêu cầu trọng tâm:** cuối mỗi tháng tổng kết theo từng học sinh: học những ngày nào, mỗi ngày bắt đầu/kết thúc lúc mấy giờ, học bao nhiêu phút, trực tiếp hay online, đơn giá, thành tiền; tổng số buổi, tổng số phút/giờ, tổng học phí, đã thu, còn phải thu. Có trang tổng quan tất cả học sinh trong tháng.
- Xuất báo cáo từng học sinh theo tháng ra **Excel (.xlsx)** và **PDF** để gửi phụ huynh; có thể xuất CSV nếu hữu ích. Báo cáo phải có kỳ tháng/năm, tên học sinh, bảng từng buổi, tổng tiền và trạng thái thanh toán. File xuất cần đọc được tiếng Việt, ngày giờ theo múi giờ Việt Nam (Asia/Ho_Chi_Minh).
- Khi thay đổi đơn giá của học sinh, **buổi cũ vẫn giữ đơn giá tại thời điểm học**; sửa buổi hoặc điều chỉnh tiền phải có cách xử lý rõ ràng.
- Không tự động tính tiền cho buổi mới lên lịch nếu chưa diễn ra; hãy đề xuất quy tắc chốt tiền đối với buổi hoàn thành, nghỉ có báo trước, nghỉ sát giờ, dạy bù và học kéo dài hơn dự kiến.
- Dữ liệu học sinh và báo cáo tiền phải được bảo vệ bằng đăng nhập, phân quyền hợp lý; có phương án sao lưu/xuất dữ liệu.
- Ưu tiên chi phí khởi đầu **0đ**, dễ triển khai lên web và dễ nâng cấp về sau. Hãy đối chiếu điều kiện, giới hạn và sự phù hợp của các gói miễn phí từ tài liệu chính thức trước khi kết luận, nhất là nếu app được dùng để quản lý hoạt động dạy học có thu tiền.

## Tôi muốn bạn trả lời theo thứ tự sau

1. **Nhận xét giải pháp:** diễn giải lại luồng sử dụng hằng ngày và luồng chốt học phí cuối tháng. Chỉ ra điều gì nên nằm trong MVP, điều gì để sau. Nếu có giả định, ghi rõ.
2. **Quy tắc tính tiền:** đề xuất công thức theo phút, dữ liệu dùng để tính (thời lượng dự kiến hay thực tế), cách làm tròn, xử lý đổi giá giữa tháng, sửa buổi đã thu tiền, buổi qua nửa đêm và buổi vắng/hủy/dạy bù. Cho ít nhất 3 ví dụ số cụ thể, gồm một tháng có nhiều buổi và thanh toán một phần.
3. **Thiết kế màn hình:** nêu các màn hình và trường cần nhập: Học sinh, Lịch học, Thêm/Sửa buổi học, Chi tiết buổi, Tổng kết tháng, Thanh toán, Xuất báo cáo. Mô tả ngắn thao tác của giáo viên từ lúc đặt lịch đến lúc gửi bảng kê cho phụ huynh.
4. **Dữ liệu tối thiểu:** đề xuất bảng/thực thể và quan hệ (ví dụ students, lessons, rate_history hoặc giá lưu tại buổi học, payments). Phân biệt dữ liệu lịch dự kiến, buổi thực học, tiền phải thu và giao dịch đã nhận. Tránh lưu tổng tiền tháng theo cách dễ lệch với dữ liệu gốc.
5. **Mẫu báo cáo:** đưa một bảng minh họa đầy đủ các cột của file Excel/PDF và dòng tổng kết. Nêu quy tắc xác định buổi nào thuộc tháng nào và cách xử lý buổi dạy bù.
6. **Lộ trình theo giai đoạn:** chia thành các bước nhỏ có thể nghiệm thu. Mỗi giai đoạn ghi: chức năng, thứ tự làm, kết quả bàn giao, tiêu chí kiểm tra bằng ví dụ thực tế và phần việc phụ thuộc giai đoạn trước. Ưu tiên tạo bản chạy được sớm, sau đó thêm tổng kết tháng, xuất file, PWA và các chức năng mở rộng.
7. **Công nghệ và triển khai:** so sánh 2 lựa chọn thực tế cho frontend, cơ sở dữ liệu, xác thực và hosting miễn phí. Đề xuất một lựa chọn chính với lý do, các bước triển khai cơ bản và rủi ro của gói miễn phí. Nói rõ "học offline/online" là hình thức dạy, khác với "app hoạt động khi mất mạng".
8. **Câu hỏi cần tôi quyết định:** chỉ hỏi tối đa 5 câu ảnh hưởng trực tiếp tới cách tính tiền hoặc cấu trúc hệ thống; đưa phương án mặc định hợp lý cho từng câu để tôi có thể duyệt nhanh.

**Ở phản hồi đầu tiên, chỉ tư vấn và lập kế hoạch; chưa viết mã, chưa tạo cơ sở dữ liệu và chưa triển khai.** Hãy trình bày bằng tiếng Việt, dùng bảng khi so sánh hoặc liệt kê các trường. Kết thúc bằng đề xuất phạm vi cụ thể của giai đoạn 1 để tôi xác nhận rồi mới bắt đầu xây dựng.
