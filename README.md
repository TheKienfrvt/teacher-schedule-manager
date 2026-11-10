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

```powershell
cd web
npm test
npm run build
```

Giai đoạn 1 đang được triển khai. Giao diện đã nối Auth, học sinh/đơn giá và lịch dự kiến với Supabase local. Chưa nghiệm thu toàn bộ luồng hoặc có chức năng chốt học phí, thanh toán và xuất báo cáo. Xem [review tiến độ](.codex/TASKS.md) và [lỗi còn lại](.codex/PROGRESS.md).
