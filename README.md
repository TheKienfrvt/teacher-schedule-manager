# Bông — quản lý lịch học và học phí

Ứng dụng dành cho một giáo viên/gia sư. Kế hoạch và trạng thái thực tế nằm trong [TASKS.md](.codex/TASKS.md) và [PROGRESS.md](.codex/PROGRESS.md).

## Yêu cầu phát triển

- Node.js 24 hoặc phiên bản đáp ứng yêu cầu của Vite hiện tại.
- Docker Desktop đang chạy để dùng Supabase local ở các task có database/Auth.

## Chạy giao diện

```powershell
cd web
npm install
Copy-Item .env.example .env.local
npm run dev
```

Khi Supabase local đã được khởi động, lấy `anon key` bằng `npx supabase status` và thay giá trị mẫu trong `web/.env.local`. Chỉ khóa công khai được phép đưa vào frontend; không ghi service role key vào file này.

Lưu `web/.env.local` dạng UTF-8 không BOM để Vite nhận đúng biến `VITE_SUPABASE_URL` ở dòng đầu. Sau khi sửa file môi trường, khởi động lại Vite.

```powershell
cd web
npm test
npm run build
```

Khi Supabase local và Vite đang chạy, có thể kiểm tra luồng thật bằng `node scripts/smoke-local-auth.mjs` và `node scripts/smoke-local-browser.mjs` từ thư mục gốc. Script trình duyệt dùng Chrome trên Windows, tạo dữ liệu thử, chụp ảnh vào `docs/previews/` rồi dọn tài khoản thử.

Giai đoạn 1 đã được kiểm tra đầu cuối trên Supabase local và Chrome desktop/mobile 390px. Chưa phát hành hoặc có chức năng chốt học phí, thanh toán và xuất báo cáo; giai đoạn 2 chờ người dùng duyệt. Xem [review tiến độ](.codex/TASKS.md) và [bằng chứng kiểm tra](.codex/PROGRESS.md).

Danh sách học sinh và lịch đang xem được cache trong `sessionStorage` của tab trong 5 phút để giảm lượt gọi API. Cache được xóa khi đăng xuất hoặc tài khoản không còn được xác minh, và được làm mới sau thao tác ghi. Phân quyền dữ liệu nằm ở RLS của Supabase, không dựa vào cache. Không đưa `service_role` key hoặc dữ liệu bí mật vào bản build web.
