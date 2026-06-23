# 🌙 BlueMoon — Hệ Thống Quản Lý Chung Cư

**BlueMoon** là ứng dụng web quản lý chung cư toàn diện, được xây dựng theo mô hình Client-Server. Hệ thống hỗ trợ hai nhóm người dùng chính — **Cư dân** và **Quản trị viên** — với đầy đủ nghiệp vụ: quản lý căn hộ, hóa đơn, thanh toán QR tự động qua SePay, đóng góp, phản ánh và thông báo.

Dự án được phát triển trong khuôn khổ môn học **Nhập môn Công nghệ Phần mềm (IT3180)** — Đại học Bách Khoa Hà Nội.

---

## 👥 Nhóm Phát Triển

| Họ và tên | Mã sinh viên | Email |
| :--- | :--- | :--- |
| Nguyễn Hoàng Gia | 202400040 | gia.nh2400040@sis.hust.edu.vn |
| Phạm Thị Bích Phương | 202400069 | phuong.ptb2400069@sis.hust.edu.vn |
| Nguyễn Tuấn Long | 202416269 | long.nt2416269@sis.hust.edu.vn |
| Bùi Tiến Dũng | 202416167 | dung.bt2416167@sis.hust.edu.vn |
| Chu Văn Linh | 202400056 | linh.cv2400056@sis.hust.edu.vn |

> **Giảng viên hướng dẫn:** TS. Nguyễn Quốc Tuấn — **Nhóm:** 9

---

## 📖 Giới Thiệu Dự Án

### Bài toán

Nhiều ban quản lý chung cư hiện vẫn kết hợp bảng tính Excel, nhóm Zalo và chuyển khoản thủ công để vận hành. Cách làm này tạo ra nhiều điểm nghẽn: dữ liệu phân tán, khó tra cứu lịch sử, chậm xác nhận thanh toán, cư dân không biết hóa đơn nào còn nợ, quản trị viên khó tổng hợp tình trạng từng căn hộ.

**BlueMoon** giải quyết bài toán đó bằng một nền tảng web thống nhất, minh bạch và có khả năng tự động hóa các luồng nghiệp vụ quan trọng.

### Mục tiêu chính

- Quản lý căn hộ, tài khoản cư dân và trạng thái cư trú theo thời gian thực.
- Tạo hóa đơn thủ công hoặc sinh hàng loạt từ mẫu khoản thu.
- Cư dân lập phiếu thanh toán bằng mã QR; hệ thống tự động ghi nhận giao dịch qua **webhook SePay**.
- Tổ chức các chiến dịch đóng góp bắt buộc / tự nguyện cho từng căn hộ.
- Tiếp nhận phản ánh từ cư dân và quy trình duyệt của ban quản lý.
- Thông báo tự động cho các sự kiện nghiệp vụ quan trọng.

---

## 👤 Tác Nhân Hệ Thống

| Tác nhân | Vai trò |
| :--- | :--- |
| **Cư dân** | Xem căn hộ, xem & thanh toán hóa đơn (QR), đóng góp, gửi phản ánh, xem thông báo |
| **Quản trị viên** | Quản lý tài khoản, căn hộ, hóa đơn, phiếu thanh toán, chiến dịch đóng góp, phản ánh, thông báo |
| **SePay** | Cung cấp QR thanh toán và gửi webhook xác nhận giao dịch chuyển khoản |
| **Google OAuth** | Xác thực danh tính người dùng qua Google ID token |
| **Gmail SMTP** | Gửi OTP xác minh email và quên mật khẩu |

---

## ✨ Tính Năng Nổi Bật

### Phân hệ chức năng

- **FR-01 → FR-03** — Xác thực: đăng nhập nội bộ (số điện thoại / username), đăng nhập Google OAuth, khôi phục mật khẩu qua OTP email.
- **FR-04 → FR-07** — Quản lý tài khoản & căn hộ: hồ sơ cá nhân, trạng thái cư trú, danh sách thành viên, trạng thái căn hộ tự cập nhật.
- **FR-08 → FR-10** — Hóa đơn: mẫu khoản thu, tạo hóa đơn lẻ hoặc sinh hàng loạt, cư dân tra cứu công nợ.
- **FR-11 → FR-15** — Thanh toán: lập phiếu thanh toán kèm mã QR, webhook SePay tự động ghi nhận giao dịch, hết hạn / hủy phiếu và mở khóa hóa đơn, thanh toán thủ công bởi quản trị viên.
- **FR-16** — Chiến dịch đóng góp: bắt buộc / tự nguyện, vòng đời DRAFT → ACTIVE → COMPLETED / CANCELED.
- **FR-17** — Phản ánh cư dân: tạo/sửa/xóa khi còn PENDING, quản trị viên duyệt APPROVED / REJECTED.
- **FR-18 → FR-19** — Thông báo: tự động cho mọi sự kiện nghiệp vụ, chuông thông báo trên giao diện, đánh dấu đã đọc.
- **FR-20 → FR-22** — Trang tổng quan theo vai trò, giao diện sáng/tối, khung chờ tải dữ liệu.

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌──────────────────┐  REST / JSON   ┌──────────────────────────────┐
│  Trình duyệt     │ ─────────────► │  Spring Boot API Server      │
│  React + Vite    │ ◄───────────── │  Controller → Service → Repo │
└──────────────────┘                └───────────────┬──────────────┘
                                                    │ JPA / SQL
                                                    ▼
                                    ┌──────────────────────────────┐
                                    │       PostgreSQL             │
                                    └──────────────────────────────┘

Tích hợp bên thứ ba:
  Google OAuth ──► Xác thực danh tính
  Gmail SMTP   ──► Gửi OTP
  SePay        ──► Tạo QR thanh toán + Webhook giao dịch
```

### Công nghệ sử dụng

| Thành phần | Công nghệ |
| :--- | :--- |
| **Frontend** | React 19, React Router 7, Vite 8, Axios 1.15 |
| **Backend** | Spring Boot 3.5, Java 25, Spring Security (JWT), Spring Data JPA |
| **Cơ sở dữ liệu** | PostgreSQL |
| **Xác thực** | JWT (JJWT 0.11.5), Google OAuth, OTP qua Gmail SMTP |
| **Thanh toán** | SePay QR + Webhook |
| **Thư viện bổ sung** | MapStruct 1.5.5, Lombok, dotenv-java 3.0.0 |

---

## 📂 Cấu Trúc Mã Nguồn

### Backend (`/backend`)
```
src/main/java/com/bluemoon/backend/
├── auth/           # Xác thực, JWT, Google OAuth, OTP
├── apartment/      # Quản lý căn hộ và cư dân
├── billing/        # Hóa đơn, phiếu thanh toán, webhook, giao dịch
├── contribution/   # Chiến dịch đóng góp
├── communication/  # Phản ánh và thông báo
├── config/         # Bảo mật, SePay, Google, CORS
├── exceptions/     # Xử lý ngoại lệ nghiệp vụ tập trung
└── common/         # Enums, constants, utilities dùng chung
```

### Frontend (`/frontend`)
```
src/
├── components/     # Các component UI dùng chung (Sidebar, NotificationBell, Modal, ...)
├── pages/          # Trang cho từng nghiệp vụ (Dashboard, Bills, Apartments, Reports, ...)
├── contexts/       # Quản lý trạng thái xác thực (AuthContext)
├── layouts/        # DashboardLayout cho Admin và Resident
├── lib/            # Axios client, định nghĩa ROUTES
└── types/          # Định nghĩa kiểu TypeScript
```

---

## 🗄️ Thiết Kế Cơ Sở Dữ Liệu

Các nhóm bảng chính trong PostgreSQL:

- **Tài khoản & cư dân**: `users`, `apartments`, `otp_verification_tokens`, `password_reset_tokens`
- **Hóa đơn & thanh toán**: `bill_templates`, `bills`, `invoices`, `invoice_bill_snapshots`, `payments`
- **Đóng góp**: `contribution_campaigns`, `apartment_contributions`
- **Phản ánh & thông báo**: `reports`, `notifications`, `notification_templates`

Các trạng thái quan trọng được chuẩn hóa qua enum:

| Enum | Giá trị |
| :--- | :--- |
| `BillStatus` | `UNPAID` → `OVERDUE` / `PAID` / `CANCELLED` |
| `InvoiceStatus` | `PENDING` → `PAID` / `EXPIRED` / `CANCELLED` |
| `PaymentStatus` | `SUCCESS` / `FAILED` |
| `ContributionCampaignStatus` | `DRAFT` → `ACTIVE` → `COMPLETED` / `CANCELED` |
| `ReportStatus` | `PENDING` → `APPROVED` / `REJECTED` |
| `ApartmentStatus` | `VACANT` / `OCCUPIED` (tự cập nhật) |

---

## 🚀 Hướng Dẫn Chạy Local

### Yêu cầu hệ thống

- **Java 25** (JDK)
- **Node.js** v18+ và **npm** / **pnpm**
- **PostgreSQL** (cài đặt trực tiếp trên máy)

---

### Bước 1 — Cấu hình biến môi trường

Tạo file `.env` từ file mẫu tại thư mục gốc:

```bash
cp .env.example .env
```

Mở `.env` và điền đầy đủ thông tin:
- Kết nối PostgreSQL (host, port, database, username, password)
- Gmail SMTP (email, app password)
- Google OAuth (Client ID)
- SePay (API key, ngân hàng)
- Khóa bí mật JWT và thời hạn token

---

### Bước 2 — Thiết lập cơ sở dữ liệu

1. Cài đặt và khởi chạy **PostgreSQL** trên máy tính của bạn.
2. Tạo một database trống có tên khớp với cấu hình trong file `.env` (ví dụ: `bluemoon_db`).
3. Đảm bảo PostgreSQL đang chạy (thông thường ở cổng `5432`).

---

### Bước 3 — Khởi động Backend

```bash
cd backend
./mvnw spring-boot:run
```

Backend chạy tại **`http://localhost:8080`**.

> **Tài liệu API (môi trường dev):**
> - Swagger UI: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
> - OpenAPI JSON: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)
>
> ⚠️ Swagger bị tắt hoàn toàn trên môi trường production.

---

### Bước 4 — Khởi động Frontend

```bash
cd frontend
npm install
npm run dev
```

Ứng dụng chạy tại **`http://localhost:5173`**.  
Sau khi đăng nhập, hệ thống tự điều hướng theo vai trò:
- Quản trị viên → `/admin-panel`
- Cư dân → `/resident-home`



## 🌐 Triển Khai Production

Để triển khai hệ thống lên máy chủ, bạn cần thiết lập môi trường chứa Java, Node.js và PostgreSQL, sau đó:

1. **Cơ sở dữ liệu**: Đảm bảo PostgreSQL production đang chạy và được cấu hình đúng trong `.env` hoặc `application-prod.yml`.
2. **Backend**: 
   - Đóng gói dự án thành file `.jar` bằng Maven.
   - Khởi chạy ứng dụng (khuyến nghị dùng `systemd` hoặc `pm2` để chạy ngầm).
3. **Frontend**: 
   - Build thư mục tĩnh bằng lệnh: `npm run build`
   - Sử dụng Nginx hoặc Apache để phục vụ thư mục `dist/` vừa được build ra.

---

## 🔮 Hướng Phát Triển Tiếp Theo

1. **Nhật ký kiểm toán** — Ghi lại mọi thao tác tài chính, duyệt phản ánh và gửi thông báo.
2. **Dashboard phân tích** — Tổng công nợ, tỷ lệ thanh toán đúng hạn, biểu đồ theo tháng.
3. **Xuất báo cáo** — PDF/Excel cho hóa đơn, danh sách cư dân và lịch sử giao dịch.
4. **Thông báo đa kênh** — Email và push notification song song với thông báo trong ứng dụng.
5. **Đặt lịch tiện ích chung** — Phòng sinh hoạt, sân thể thao, bãi đỗ xe.
6. **Phân quyền nhiều cấp** — Kế toán, kỹ thuật, lễ tân, trưởng ban quản trị.
7. **Bảo mật nâng cao** — Rate limiting, HTTPS, webhook HMAC, luân phiên khóa JWT.
