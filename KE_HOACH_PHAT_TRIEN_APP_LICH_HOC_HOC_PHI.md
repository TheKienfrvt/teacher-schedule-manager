# Kế hoạch phát triển web app lịch học và học phí

> Tài liệu tư vấn và lập kế hoạch, ngày 09/11/2026. Nguồn yêu cầu: [PROMPT_Codex_ke_hoach_app_lich_hoc_hoc_phi.md](PROMPT_Codex_ke_hoach_app_lich_hoc_hoc_phi.md). Chưa viết mã ứng dụng, chưa tạo cơ sở dữ liệu và chưa triển khai.

## 1. Review yêu cầu và hướng giải pháp

**Mục tiêu:** Một giáo viên quản lý nhiều học sinh trên máy tính và điện thoại. Giáo viên là người duy nhất thao tác trong ứng dụng: đặt lịch, sửa/xóa ghi chú lịch khi có việc đột xuất, xác nhận ai đã học, ghi nhận tiền và xuất bảng kê. Học sinh và phụ huynh không cần tài khoản.

Luồng sử dụng: **Tạo học sinh và thống nhất đơn giá riêng cho từng em (ví dụ 100.000đ/giờ) → ghi chú lịch dự kiến cho một hoặc nhiều em → sửa/xóa lịch nếu thay đổi → sau giờ học xác nhận thời gian thực học của từng em → tính học phí từng em → xem tổng kết tháng → ghi nhận khoản đã thu → xuất bảng kê.** Một mục lịch mới chỉ nhắc giáo viên ai sẽ học lúc nào, **chưa tính tiền**. Báo cáo tháng lấy từ các lần học đã xác nhận và giao dịch thanh toán, không nhập tay tổng tiền.

**Giả định đã cập nhật từ chú thích:** Một giáo viên có thể xếp **nhiều học sinh trong cùng buổi học nhóm**, hoặc có **nhiều mục lịch riêng chồng khung giờ**. Ứng dụng cảnh báo chồng giờ để giáo viên kiểm tra nhưng không chặn lưu. Mỗi học sinh có đơn giá, thời lượng thực học và tiền riêng, dù cùng một buổi. Tiền tệ VND; múi giờ `Asia/Ho_Chi_Minh`; giáo viên tải file để tự gửi phụ huynh, không có tài khoản học sinh/phụ huynh.

| Trong MVP | Để sau MVP |
|---|---|
| Đăng nhập giáo viên; học sinh và đơn giá riêng; lịch ngày/tuần/tháng; chọn nhiều học sinh trong một mục lịch; cho phép lịch chồng giờ sau cảnh báo; sửa/xóa lịch dự kiến; xác nhận thời lượng thực tế từng em; hủy/dạy bù; tổng kết tháng từng em; thanh toán từng phần; xuất XLSX/PDF; sao lưu. | Nhiều giáo viên cùng quản lý; lịch lặp tự động; thông báo; thu tiền trực tuyến; PWA và thao tác khi mất mạng; phân tích nâng cao. Không dự kiến tài khoản học sinh/phụ huynh. |

**Đánh giá hướng phát triển:** Dùng ứng dụng web responsive. Tách **khung lịch/buổi dạy** khỏi **dòng tham gia của từng học sinh**; chính dòng tham gia mới chứa thời lượng, đơn giá đã chốt và tiền. Cách này đáp ứng học nhóm mà vẫn tổng kết riêng cho từng em. Postgres phù hợp với quan hệ này và báo cáo tổng hợp. Bảo mật, thử khôi phục bản sao lưu và đối soát tiền là điều kiện nghiệm thu.

## 2. Ngôn ngữ và công nghệ dự kiến

| Thành phần | Lựa chọn chính | Lý do |
|---|---|---|
| Ngôn ngữ ứng dụng | **TypeScript** | Một kiểu dữ liệu cho giao diện và logic nghiệp vụ; kiểm soát số phút, VND và trạng thái buổi học. |
| Giao diện | **React + Vite**, CSS responsive | Chạy trên trình duyệt điện thoại/máy tính; bản build tĩnh phù hợp hosting miễn phí. |
| Cơ sở dữ liệu | **PostgreSQL qua Supabase**; migration bằng SQL | Quan hệ, ràng buộc dữ liệu, truy vấn báo cáo tháng và lịch sử thay đổi rõ ràng. |
| Đăng nhập/phân quyền | **Supabase Auth + Row Level Security (RLS)** | Mỗi giáo viên chỉ đọc/ghi dữ liệu của mình; khóa quản trị không nằm trong trình duyệt. |
| Hosting | **Cloudflare Workers Static Assets** | Phục vụ bản React tĩnh; tính phí, giới hạn và khả năng hoạt động cần theo dõi như mục 8. |
| Xuất file | Thư viện TypeScript cho XLSX/PDF, tạo từ cùng dữ liệu bảng kê | Giữ số tiền nhất quán giữa màn hình và file; kiểm tra font Unicode tiếng Việt trước nghiệm thu. |
| Kiểm thử | Kiểm thử đơn vị quy tắc tiền; kiểm thử RLS và luồng chính | Tập trung vào rủi ro sai tiền, lộ dữ liệu và báo cáo lệch. |

Không dùng số thực nhị phân để cộng tiền. Đơn giá, thành tiền, thanh toán là **số nguyên VND**; thời lượng là **số nguyên phút**. Nếu tạo PDF trong trình duyệt, phải đóng gói font hỗ trợ đầy đủ dấu tiếng Việt và kiểm tra mở trên điện thoại.

## 3. Quy tắc nghiệp vụ đề xuất để review

| Tình huống | Quy tắc mặc định đề xuất |
|---|---|
| Mục lịch mới | Trạng thái `scheduled`, chỉ là ghi chú lịch cho một hoặc nhiều học sinh; tất cả dòng tham gia có tiền phải thu bằng 0. Giờ kết thúc dự kiến = giờ bắt đầu + số phút dự kiến. Giáo viên được sửa hoặc xóa mục lịch trước khi chốt; xóa khỏi giao diện nhưng lưu dấu vết để đối soát. |
| Nhiều học sinh cùng buổi | Chọn nhiều học sinh trong một mục lịch. Khi hoàn thành, xác nhận riêng giờ bắt đầu và số phút **thực học** cho từng em (có nút áp dụng cùng thời gian cho cả nhóm). Mỗi em tính theo đơn giá của mình, không chia đều tiền buổi. |
| Hai mục lịch chồng giờ | Cảnh báo rõ tên học sinh và khoảng giờ bị trùng; giáo viên có thể tiếp tục lưu vì lịch chồng có thể là chủ ý. Không tự gộp hai mục lịch thành một buổi học nhóm. |
| Buổi hoàn thành | Giáo viên xác nhận ai thực sự học. Với từng học sinh đã học: `tiền = floor((đơn giá VND/giờ của em × phút thực học của em + 30) / 60)`; làm tròn **từng dòng học sinh/buổi đến 1 VND, .5 làm tròn lên**. |
| Đổi đơn giá | Lưu thời điểm hiệu lực của giá mới. Khi xác nhận học, sao chép đơn giá của từng em vào dòng tham gia. Buổi cũ không tự đổi giá; thay giá đã chốt phải có thao tác và lý do rõ ràng. |
| Hủy/nghỉ báo trước | Không tính tiền theo mặc định; lưu lý do và thời điểm hủy. |
| Nghỉ sát giờ | Chưa tự tính phạt. Nếu có thỏa thuận, giáo viên nhập khoản phí cố định riêng và lý do; hiển thị riêng trên báo cáo. |
| Dạy bù | Tạo mục lịch mới liên kết tới mục/dòng học bị hủy. Chỉ dòng tham gia thực học ở buổi bù mới tính tiền; không đếm hai lần. Trong nhóm, có thể chỉ một học sinh cần dạy bù. |
| Học kéo dài/rút ngắn | Dùng phút thực học để tính; giữ nguyên phút dự kiến để đối chiếu. |
| Qua nửa đêm/cuối tháng | Lưu giờ bắt đầu thực tế và giờ kết thúc tính theo phút; toàn bộ buổi thuộc **tháng của giờ bắt đầu thực tế** theo `Asia/Ho_Chi_Minh`, không tách tiền sang tháng sau. Buổi chưa hoàn thành dựa trên ngày dự kiến để hiển thị lịch. |
| Sửa/xóa sau khi đã chốt | Ghi lịch sử người sửa, thời điểm, giá trị trước/sau và lý do. Không xóa cứng dữ liệu đã tính tiền. Nếu đã có thanh toán hoặc báo cáo, tạo khoản điều chỉnh tăng/giảm và đối soát lại bảng kê của học sinh liên quan. |
| Thanh toán một phần | Ghi mỗi lần nhận tiền thành giao dịch riêng, gắn với học sinh và kỳ tháng/năm. `Còn phải thu = tổng tiền buổi + điều chỉnh - tổng tiền đã nhận + tiền hoàn trả`. MVP không nhận khoản vượt tổng phải thu; trường hợp ứng trước/chuyển dư là quyết định mở rộng. |

**Ví dụ tính tiền:**

1. Học sinh An có giá 100.000đ/giờ; lịch ghi 60 phút nhưng thực học 90 phút: 100.000 × 90 ÷ 60 = **150.000đ**.
2. 100.001đ/giờ × 30 phút ÷ 60 = 50.000,5đ, làm tròn từng buổi thành **50.001đ**.
3. Ngày 03/11 An và Bình học cùng nhóm 90 phút: An 100.000đ/giờ → **150.000đ**, Bình 120.000đ/giờ → **180.000đ**. Đây là một buổi trên lịch nhưng là hai dòng học phí riêng. Trong tháng 11 của An: 03/11 150.000đ, 10/11 60 phút × 120.000đ/giờ = 120.000đ (giá mới), 17/11 30 phút × 100.000đ/giờ = 50.000đ (giá riêng đã chốt). Tổng của **An: 3 lần học, 180 phút, 320.000đ**; đã nhận **200.000đ**, còn **120.000đ**. Tiền của Bình không cộng vào báo cáo An.

Điểm đã rõ từ chú thích: có thể có nhiều học sinh cùng buổi và nhiều mục lịch chồng giờ; chỉ giáo viên thao tác. Những quy tắc còn cần chốt: phí nghỉ sát giờ, nhận tiền trước/dư, thời điểm hiệu lực giá và cách xử lý thời lượng khác nhau trong nhóm. Mặc định chi tiết ở mục 10.

## 4. Màn hình và thao tác

| Màn hình | Nội dung/trường chính | Thao tác chính |
|---|---|---|
| Học sinh | Tên, thông tin liên hệ tối thiểu, ghi chú, đơn giá VND/giờ, ngày hiệu lực giá, trạng thái hoạt động | **Giáo viên** tạo/sửa hồ sơ, xem lịch sử giá và những lần học; học sinh không đăng nhập hay thao tác. |
| Lịch học | Chế độ ngày/tuần/tháng, lọc học sinh, thời gian, trạng thái, đánh dấu học nhóm và cảnh báo trùng | Giáo viên đặt lịch, sửa/xóa mục lịch dự kiến. Lịch chồng giờ được cảnh báo nhưng vẫn lưu được. |
| Thêm/Sửa buổi | Chọn **một hoặc nhiều học sinh**, ngày/giờ bắt đầu dự kiến, nút 30/60/90/120 phút hoặc phút tùy chọn, trực tiếp/online, địa điểm hoặc URL, ghi chú | Xem giờ kết thúc tự tính; nếu thêm học sinh vào nhóm, thấy đơn giá riêng từng em; lưu ghi chú lịch. |
| Chi tiết buổi | Giờ/phút dự kiến; từng học sinh và giờ/phút thực học, đơn giá đã chốt, thành tiền, trạng thái; lý do hủy/điều chỉnh; liên kết dạy bù | Xác nhận học cả nhóm hoặc từng em, sửa/xóa lịch chưa chốt, hủy/dạy bù, xem lịch sử sửa. |
| Tổng kết tháng | Tháng/năm, từng học sinh, từng buổi, tổng phút, tổng buổi, tổng phải thu, đã thu, còn thu | Kiểm tra từng dòng, mở buổi sai để sửa có lý do. |
| Thanh toán | Học sinh, kỳ tháng, ngày nhận, số tiền VND, phương thức, ghi chú/mã tham chiếu | Ghi từng lần nhận, xem số còn phải thu, hoàn trả/sửa bằng giao dịch đối ứng. |
| Xuất báo cáo | Học sinh, kỳ tháng, định dạng XLSX/PDF, xem trước | Tải file và giáo viên tự gửi cho phụ huynh. |

**Thao tác hằng ngày của giáo viên:** chọn một hoặc nhiều học sinh và ghi lịch → xem cảnh báo chồng giờ → khi có việc đột xuất, sửa/xóa lịch dự kiến → sau giờ học xác nhận ai đã học và số phút của từng em → kiểm tra tiền từng em. **Cuối tháng:** mở tổng kết theo học sinh → kiểm tra buổi thiếu xác nhận, hủy và điều chỉnh → nhập các lần đã thu → xem trước và tải bảng kê. Học sinh và phụ huynh không dùng ứng dụng.

## 5. Dữ liệu tối thiểu và quan hệ

| Bảng/thực thể | Trường cốt lõi | Ghi chú |
|---|---|---|
| `profiles` | `id` liên kết Auth, tên giáo viên | Chỉ giáo viên đăng nhập. Không có tài khoản học sinh/phụ huynh. |
| `students` | `id`, `owner_id`, tên, liên hệ, ghi chú, trạng thái | Mỗi học sinh có hồ sơ và đơn giá riêng, thuộc một giáo viên. |
| `rate_history` | `id`, `student_id`, `effective_from`, `rate_vnd_per_hour`, người tạo | Lưu lịch sử giá từng học sinh; không sửa giá cũ khi đổi giá. |
| `sessions` | `id`, `owner_id`, bắt đầu dự kiến, phút dự kiến, hình thức, địa điểm/URL, trạng thái lịch, `deleted_at`, ghi chú | Một mục lịch/buổi dạy có thể chứa một hoặc nhiều học sinh. Xóa lịch dự kiến bằng cách ẩn có lưu dấu vết. Không áp đặt ràng buộc cấm chồng giờ. |
| `session_students` | `id`, `session_id`, `student_id`, bắt đầu thực tế, phút thực học, trạng thái tham gia, `rate_snapshot_vnd_per_hour`, `charge_vnd`, `makeup_for_id` | Một dòng cho mỗi học sinh trong buổi; đây là nguồn tính học phí theo em. Cặp `(session_id, student_id)` là duy nhất. |
| `fee_adjustments` | `id`, `student_id`, `session_student_id` nếu có, kỳ tháng, `amount_vnd` có dấu, lý do, người tạo, thời điểm | Phí hủy sát giờ hoặc sửa tiền sau chốt; không thay thế lịch sử cũ. |
| `payments` | `id`, `student_id`, kỳ tháng, ngày nhận, `amount_vnd`, loại nhận/hoàn, phương thức, ghi chú | Tiền thực nhận tách khỏi khoản phải thu. |
| `audit_events` | đối tượng, hành động, trước/sau, người làm, thời điểm, lý do | Bắt buộc cho sửa buổi đã chốt, điều chỉnh tiền và sửa giao dịch. |

Quan hệ chính: `profiles 1—N students`, `profiles 1—N sessions`, `sessions 1—N session_students`, `students 1—N session_students`, `students 1—N rate_history`, `students 1—N payments`. Một học sinh có thể xuất hiện trong nhiều mục lịch, kể cả cùng khung giờ; hệ thống cảnh báo để giáo viên tự quyết định. Tất cả bảng chứa dữ liệu học sinh phải có RLS theo chủ sở hữu và ràng buộc để không ghép học sinh của giáo viên khác vào buổi học. **Không lưu “tổng học phí tháng” như nguồn sự thật**; tính từ các dòng học sinh đã chốt, điều chỉnh và thanh toán.

## 6. Mẫu bảng kê tháng

**Bảng kê học sinh An — tháng 11/2026 — múi giờ Asia/Ho_Chi_Minh**

| Ngày học | Bắt đầu | Kết thúc | Phút thực học | Hình thức | Đơn giá/giờ | Thành tiền | Ghi chú |
|---|---:|---:|---:|---|---:|---:|---|
| 03/11/2026 | 18:00 | 19:30 | 90 | Trực tiếp | 100.000đ | 150.000đ | Học nhóm cùng Bình |
| 10/11/2026 | 18:00 | 19:00 | 60 | Online | 120.000đ | 120.000đ |  |
| 17/11/2026 | 18:00 | 18:30 | 30 | Trực tiếp | 100.000đ | 50.000đ | Giá riêng đã chốt |
| **Tổng** |  |  | **180 phút = 3 giờ** | **3 buổi** |  | **320.000đ** |  |

Phần cuối file: **Điều chỉnh: 0đ · Tổng phải thu: 320.000đ · Đã thu: 200.000đ · Còn phải thu: 120.000đ · Trạng thái: thanh toán một phần.** File cần có tên học sinh, kỳ tháng/năm, ngày xuất, tên giáo viên, bảng từng buổi và trạng thái thanh toán. Excel phải giữ số tiền ở ô dạng số để cộng lại được; PDF cần font Unicode tiếng Việt.

Mỗi file chỉ lấy **dòng tham gia của học sinh được chọn**: buổi học nhóm 03/11 cũng xuất hiện trên báo cáo của Bình với đơn giá, phút thực học và tiền của Bình. Buổi dạy bù hiển thị ở kỳ **ngày thực học của học sinh ở buổi bù**, có ghi chú “Dạy bù cho ngày …”. Dòng học bị hủy không tính vào số lần học hay học phí, nhưng có thể hiện trong nhật ký đối soát. Buổi qua nửa đêm thuộc kỳ tháng của giờ bắt đầu thực tế của học sinh đó ở Việt Nam.

## 7. Cấu trúc thư mục dự kiến

Đây là **đề xuất**, chưa tạo các thư mục hay file mã nguồn.

```text
lich-hoc-hoc-phi/
├── README.md                      # Cài đặt, chạy, biến môi trường
├── docs/
│   ├── requirements.md            # Yêu cầu và quyết định nghiệp vụ
│   ├── money-rules.md             # Quy tắc tính tiền, ví dụ nghiệm thu
│   └── release-checklist.md       # Kiểm tra trước mỗi bản phát hành
├── web/
│   ├── public/                    # Ảnh/icon tĩnh
│   ├── src/
│   │   ├── app/                   # Router, cấu hình, layout
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── students/
│   │   │   ├── calendar/
│   │   │   ├── sessions/            # Mục lịch và buổi học nhóm
│   │   │   ├── attendance/          # Xác nhận học/tiền theo học sinh
│   │   │   ├── monthly-summary/
│   │   │   ├── payments/
│   │   │   └── exports/
│   │   ├── domain/                # Kiểu dữ liệu và quy tắc tiền/thời gian
│   │   ├── shared/                # Thành phần UI, định dạng VND/ngày giờ
│   │   └── lib/                   # Kết nối Supabase, tiện ích dùng chung
│   └── tests/                     # Kiểm thử luồng giao diện
├── supabase/
│   ├── migrations/                # Lược đồ và chính sách RLS có phiên bản
│   └── tests/                     # Kiểm thử cho phép/từ chối truy cập
└── .github/workflows/             # Kiểm tra tự động và phát hành khi được duyệt
```

Quy tắc tổ chức: logic tính tiền từng học sinh ở `domain/` và dùng chung cho màn hình, tổng kết, xuất file; `sessions/` quản lý ghi chú lịch còn `attendance/` quản lý kết quả thực học của từng em. Migration luôn đi cùng thay đổi cấu trúc dữ liệu. Không đưa khóa quản trị hay dữ liệu thật vào repository.

## 8. So sánh hai hướng công nghệ và chi phí 0đ

Đã đối chiếu tài liệu chính thức ngày **09/11/2026**. Giới hạn có thể thay đổi; kiểm tra lại trước khi tạo tài khoản và triển khai thật.

| Tiêu chí | A — React/Vite + Supabase + Cloudflare Workers Static Assets (**đề xuất**) | B — React/Vite + Firebase Auth/Firestore/Hosting Spark |
|---|---|---|
| Frontend/hosting | React tĩnh trên Workers Static Assets. Yêu cầu tài nguyên tĩnh miễn phí, không giới hạn; nếu thêm Worker xử lý server thì giới hạn Free 100.000 yêu cầu/ngày. [Cloudflare static assets](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) | React tĩnh trên Firebase Hosting. Spark không yêu cầu phương thức thanh toán, nhưng có quota Hosting. [Firebase pricing](https://firebase.google.com/pricing), [Hosting quotas](https://firebase.google.com/docs/hosting/usage-quotas-pricing) |
| Dữ liệu | Supabase Postgres Free: 500 MB/database, 2 dự án hoạt động, 50.000 người dùng hoạt động/tháng; dự án ít hoạt động có thể bị tạm dừng sau khoảng 1 tuần; **không có backup tự động** ở Free. [Supabase pricing](https://supabase.com/pricing), [billing docs](https://supabase.com/docs/guides/platform/billing-on-supabase) | Firestore: một database miễn phí/dự án, 1 GiB, 50.000 lượt đọc và 20.000 lượt ghi/ngày. Báo cáo tổng hợp/đối soát cần thiết kế cẩn thận theo mô hình tài liệu. [Firestore pricing](https://firebase.google.com/docs/firestore/pricing) |
| Xác thực/phân quyền | Supabase Auth + RLS, thuận tiện cô lập dữ liệu theo giáo viên. Phải viết và kiểm thử chính sách trên từng bảng. [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) | Firebase Auth + Firestore Security Rules. Spark có các giới hạn riêng theo phương thức đăng nhập; phải kiểm thử rule và lượt đọc. [Firebase Auth limits](https://firebase.google.com/docs/auth/limits) |
| Phù hợp nghiệp vụ | SQL thuận lợi cho tổng hợp tháng, lịch sử giá, thanh toán và kiểm tra toàn vẹn; **chọn A**. | Ít dịch vụ hơn về mặt nhà cung cấp, nhưng tổng hợp tài chính và truy vấn quan hệ phức tạp hơn; là phương án dự phòng. |
| Rủi ro miễn phí | Supabase Free có thể tạm dừng và không có backup tự động. Cloudflare Free được mô tả cho dự án cá nhân/sở thích, không phải dịch vụ tối quan trọng; chưa nên xem 0đ là cam kết vận hành lâu dài. [Cloudflare plans](https://www.cloudflare.com/plans/) | Spark vượt quota thì dịch vụ tương ứng có thể dừng đến kỳ sau hoặc phải nâng cấp. Firebase nêu Spark có thể dùng trong app production với dịch vụ miễn phí, nhưng vẫn chịu quota theo dịch vụ. [Firebase plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans) |

**Nhận định về app có thu học phí:** Tài liệu giá công khai không phải cam kết về tính sẵn sàng hay bảo đảm mọi cách sử dụng thương mại. Việc app ghi sổ cho hoạt động dạy có thu tiền tự nó không chứng minh được một dịch vụ miễn phí bị cấm; trước khi đưa dữ liệu thật lên, kiểm tra điều khoản hiện hành của [Supabase](https://supabase.com/terms) và [Cloudflare](https://www.cloudflare.com/terms/), cùng yêu cầu bảo vệ dữ liệu cá nhân áp dụng cho hoạt động của giáo viên. Nếu cần độ tin cậy và khôi phục nhanh, dự trù gói trả phí hoặc phương án tự quản lý thay vì phụ thuộc vĩnh viễn vào Free.

**Các bước triển khai sau khi được duyệt:** (1) tạo repository và dự án Supabase; (2) migration, RLS và kiểm thử quyền; (3) cấu hình biến môi trường chỉ chứa khóa công khai; (4) build React và triển khai tĩnh lên Cloudflare Workers; (5) cấu hình URL đăng nhập, kiểm tra HTTPS, miền và thử trên điện thoại; (6) tạo bản sao lưu thủ công định kỳ và thử khôi phục. Không triển khai ở giai đoạn tư vấn hiện tại.

“Học trực tiếp/online” là **hình thức buổi dạy**. “App hoạt động khi mất mạng” là khả năng kỹ thuật khác; bản đầu cần mạng để đăng nhập và lưu dữ liệu. PWA/offline sẽ đánh giá sau với quy tắc đồng bộ và xử lý xung đột.

## 9. Quy trình làm việc, task và tiêu chí review

**Chu trình cho mỗi giai đoạn:** chốt quy tắc → cập nhật tài liệu và ví dụ → làm một lát cắt chạy được → kiểm tra tự động phần có rủi ro → review giao diện trên máy tính/điện thoại → nghiệm thu với dữ liệu giả → mới sang giai đoạn tiếp. Mỗi thay đổi tiền hoặc quyền truy cập cần xem diff, có ví dụ trước/sau và thử lại báo cáo tháng. Dữ liệu thật chỉ dùng sau khi kiểm tra bảo mật và khôi phục.

| Giai đoạn / thứ tự task | Kết quả bàn giao | Tiêu chí nghiệm thu thực tế | Phụ thuộc |
|---|---|---|---|
| **0. Chốt nghiệp vụ**: duyệt các điểm còn mở ở mục 10, mẫu bảng kê, trường dữ liệu bắt buộc | Tài liệu yêu cầu và quy tắc tiền được duyệt | Ví dụ học nhóm An/Bình, lịch chồng giờ và sửa/xóa lịch được chấp nhận; rõ phí hủy, tháng tính và tiền dư | Không |
| **1. Bản chạy được sớm**: khởi tạo React/TypeScript, giao diện responsive; đăng nhập giáo viên; học sinh và đơn giá; tạo/sửa/xóa lịch; chọn nhiều em trong một buổi; ngày/tuần/tháng; cảnh báo trùng không chặn | App chạy local với dữ liệu giả/test và migration có RLS | Giáo viên A không xem được dữ liệu B; buổi An+Bình 18:00–19:30 hiển thị chung một mục lịch; mục khác 18:30 được cảnh báo nhưng vẫn lưu được; lịch bị xóa biến mất khỏi giao diện; xem được trên điện thoại | 0 |
| **2. Thực học và tiền từng em**: xác nhận tham gia theo học sinh, phút thực học riêng, hủy/dạy bù, giá snapshot, điều chỉnh và audit | Luồng từ lịch sang từng khoản phải thu | Mục lịch dự kiến 0đ; cùng 90 phút An 100.000đ/giờ = 150.000đ, Bình 120.000đ/giờ = 180.000đ; đổi giá không sửa buổi cũ; một em nghỉ không làm mất buổi của em kia | 1 |
| **3. Tổng kết và thanh toán**: tổng hợp từng học sinh/toàn bộ, kỳ tháng, nhận tiền nhiều lần, đối soát | Trang tổng kết tháng và nhật ký thanh toán | Báo cáo An 320.000đ, đã thu 200.000đ, còn 120.000đ; không cộng tiền Bình; dòng học 30/11 qua 01/12 thuộc tháng 11; dữ liệu giáo viên khác không rò rỉ | 2 |
| **4. File và sao lưu**: xem trước, XLSX/PDF tiếng Việt, xuất dữ liệu, quy trình backup/restore | File gửi phụ huynh và hướng dẫn sao lưu | XLSX cộng được cột tiền; PDF không lỗi dấu; tiền trên hai file bằng màn hình; thử khôi phục trên dữ liệu test | 3 |
| **5. Triển khai và mở rộng**: phát hành web, kiểm tra quyền, theo dõi quota; sau đó cân nhắc PWA và lịch lặp | Bản web sử dụng thực tế và danh sách cải tiến | Giáo viên đăng nhập/lưu/xuất file trên điện thoại; thử một lỗi mạng; quota và lịch sao lưu có người chịu trách nhiệm | 4 |

**Checklist review mỗi giai đoạn:**

- Nghiệp vụ: mục lịch chưa học luôn 0đ; học nhóm tính đúng theo từng em; chồng giờ chỉ cảnh báo; sửa/xóa lịch dự kiến hoạt động; tổng tháng khớp chi tiết từng em; sửa dữ liệu tài chính có lý do và dấu vết.
- Dữ liệu/quyền: RLS từ chối truy cập chéo tài khoản; không có khóa quản trị trong frontend; đầu vào phút, giá, URL được kiểm tra.
- Giao diện: đọc và thao tác được ở màn hình điện thoại; thông báo trùng giờ/hủy/sửa rõ ràng; định dạng ngày giờ Việt Nam.
- Vận hành: migration có thể lặp lại trên môi trường test; thử sao lưu/khôi phục trước dữ liệu thật; theo dõi quota và trạng thái dịch vụ.

## 10. Tối đa 5 quyết định cần người dùng duyệt

| Câu cần quyết định | Mặc định đề xuất |
|---|---|
| 1. Trong buổi học nhóm, các em có thể bắt đầu/kết thúc khác nhau không? | **Có**; cho nhập thời gian thực học riêng từng em, kèm nút áp dụng chung để thao tác nhanh. |
| 2. Nghỉ sát giờ có thu phí? Nếu có, mốc thời gian và mức phí nào? | **Không tự thu**; nếu phát sinh, nhập phí cố định có lý do. |
| 3. Đơn giá mới có hiệu lực từ ngày nào; buổi đã đặt nhưng chưa học dùng giá nào? | Ngày hiệu lực do giáo viên chọn; **chốt theo giá có hiệu lực tại giờ bắt đầu thực học**, trừ khi ghi giá riêng. |
| 4. Có nhận tiền ứng trước hoặc thanh toán dư rồi chuyển sang tháng khác không? | MVP **chỉ ghi tiền vào kỳ tháng, không vượt phải thu**; xử lý tiền ứng trước ở giai đoạn sau. |
| 5. Khi xóa một mục lịch chưa học, cần giữ lịch sử để tra lại không? | **Có**; ẩn khỏi lịch thông thường nhưng lưu dấu vết. Không cho xóa cứng buổi đã tính tiền. |

**Đề xuất phạm vi giai đoạn 1 để xác nhận:** Sau khi chốt các điểm còn mở, xây dựng app React/TypeScript chạy local gồm đăng nhập **chỉ cho giáo viên**, quản lý học sinh và đơn giá riêng, lịch ngày/tuần/tháng, tạo/sửa/xóa mục lịch dự kiến, chọn nhiều học sinh vào cùng buổi, cảnh báo chồng giờ nhưng vẫn cho lưu và RLS cô lập dữ liệu. Nghiệm thu bằng các tình huống ở dòng giai đoạn 1; học phí tháng và xuất file thuộc các giai đoạn sau.
