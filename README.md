# 🏠 Family Website — Website Riêng Cho Gia Đình

Website riêng cho gia đình với 3 chức năng chính: Album ảnh, Lịch gia đình, và Trang quản trị.

## ✨ Tính năng

- **Album ảnh**: Grid ảnh đẹp, slideshow toàn màn hình, swipe mobile, phím mũi tên
- **Lịch gia đình**: Xem toàn bộ 12 tháng, sự kiện tái diễn, click xem chi tiết
- **Quản trị**: Dashboard, quản lý ảnh, quản lý sự kiện, quản lý tài khoản
- **Phân quyền**: Admin (toàn quyền) và Member (upload ảnh, xóa ảnh của mình)
- **Bảo mật**: NextAuth.js + bcrypt, session JWT

## 🛠 Công nghệ

| Thành phần | Công nghệ |
|-----------|-----------|
| Frontend | Next.js 14 + React 18 |
| Styling | TailwindCSS |
| Database | SQLite (via Prisma ORM) |
| Auth | NextAuth.js (Credentials) |
| Password hash | bcryptjs |
| Icons | lucide-react |

---

## 🚀 Cài đặt từng bước

### Bước 1 — Yêu cầu hệ thống

Cài đặt [Node.js](https://nodejs.org) phiên bản 18 trở lên.

Kiểm tra:
```bash
node --version   # v18.x.x trở lên
npm --version    # 9.x.x trở lên
```

### Bước 2 — Cài dependencies

```bash
cd family-website
npm install
```

### Bước 3 — Tạo file cấu hình

Sao chép file `.env.example` thành `.env.local`:

```bash
cp .env.example .env.local
```

Mở `.env.local` và chỉnh sửa:

```env
# Tạo secret ngẫu nhiên (bắt buộc):
NEXTAUTH_SECRET="thay-bang-chuoi-ngau-nhien-dai-hon-32-ky-tu"

# URL của app (giữ nguyên khi chạy local):
NEXTAUTH_URL="http://localhost:3000"

# Database path:
DATABASE_URL="file:./prisma/dev.db"

# Tên app (tùy chỉnh):
NEXT_PUBLIC_APP_NAME="Gia Đình Ngô"
```

> **Tạo NEXTAUTH_SECRET:** Chạy lệnh này trong terminal:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
> ```

### Bước 4 — Tạo database

```bash
npx prisma db push
```

### Bước 5 — Tạo dữ liệu ban đầu

```bash
npm run db:seed
```

Lệnh này sẽ tạo:
- Tài khoản **admin** / mật khẩu **admin123** (Admin)
- Tài khoản **member** / mật khẩu **member123** (Member)
- 5 sự kiện mẫu (sinh nhật, kỷ niệm, họp mặt)

> ⚠️ **Quan trọng:** Đổi mật khẩu ngay sau khi cài đặt!

### Bước 6 — Chạy server

```bash
npm run dev
```

Mở trình duyệt tại: **http://localhost:3000**

---

## 📁 Cấu trúc thư mục

```
family-website/
├── prisma/
│   ├── schema.prisma        # Schema database
│   └── seed.ts              # Dữ liệu mẫu
├── public/
│   └── uploads/             # Thư mục lưu ảnh upload
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Trang Home
│   │   ├── globals.css      # Global styles
│   │   ├── album/           # Trang album ảnh
│   │   ├── calendar/        # Trang lịch gia đình
│   │   ├── admin/           # Trang quản trị
│   │   │   ├── login/       # Đăng nhập
│   │   │   ├── dashboard/   # Tổng quan
│   │   │   ├── photos/      # Quản lý ảnh
│   │   │   ├── calendar/    # Quản lý sự kiện
│   │   │   └── accounts/    # Quản lý tài khoản
│   │   └── api/             # API routes
│   │       ├── auth/        # NextAuth
│   │       ├── photos/      # API ảnh
│   │       ├── events/      # API sự kiện
│   │       └── accounts/    # API tài khoản
│   ├── components/
│   │   ├── ui/              # Navbar
│   │   ├── album/           # PhotoGrid, Slideshow
│   │   ├── calendar/        # YearCalendar
│   │   └── admin/           # AdminSidebar
│   ├── lib/
│   │   ├── auth.ts          # NextAuth config
│   │   ├── db.ts            # Prisma client
│   │   └── utils.ts         # Utilities
│   └── types/
│       └── next-auth.d.ts   # Type extensions
├── .env.example             # Template biến môi trường
├── .gitignore
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🔐 Tài khoản mặc định

| Username | Mật khẩu | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| member | member123 | Member |

**Đường dẫn đăng nhập:** http://localhost:3000/admin/login

---

## 📱 Các trang

| Đường dẫn | Mô tả | Quyền |
|-----------|-------|-------|
| `/` | Trang chủ | Public |
| `/album` | Xem album ảnh | Public |
| `/calendar` | Xem lịch gia đình | Public |
| `/admin/login` | Đăng nhập | Public |
| `/admin/dashboard` | Dashboard | Đăng nhập |
| `/admin/photos` | Quản lý ảnh | Đăng nhập |
| `/admin/calendar` | Quản lý sự kiện | Admin |
| `/admin/accounts` | Quản lý tài khoản | Admin |

---

## 🌐 Deploy lên internet

### Option 1: Vercel (Khuyến nghị)

1. Push code lên GitHub
2. Kết nối repository với [Vercel](https://vercel.com)
3. Thêm environment variables trong Vercel dashboard
4. **Lưu ý:** Thay SQLite bằng PostgreSQL (Vercel Postgres hoặc Neon) khi deploy

### Option 2: VPS (Ubuntu)

```bash
# Cài Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone và setup
git clone <your-repo>
cd family-website
npm install
cp .env.example .env.local
# Chỉnh .env.local...

npm run db:push
npm run db:seed
npm run build

# Chạy với PM2
npm install -g pm2
pm2 start npm --name "family-website" -- start
pm2 save
```

---

## 🔧 Lệnh hữu ích

```bash
npm run dev          # Chạy development server
npm run build        # Build production
npm run start        # Chạy production server
npm run db:push      # Áp dụng schema vào database
npm run db:seed      # Tạo dữ liệu mẫu
npm run db:studio    # Mở Prisma Studio (xem database)
```

---

## ❓ Câu hỏi thường gặp

**Q: Ảnh upload ở đâu?**
Ảnh được lưu trong `public/uploads/`. Khi deploy, cần dùng object storage (S3, Cloudflare R2) thay vì lưu trên disk.

**Q: Làm sao đổi tên website?**
Sửa `NEXT_PUBLIC_APP_NAME` trong `.env.local`.

**Q: Database bị mất khi restart?**
SQLite file được lưu tại `prisma/dev.db`. File này không bị xóa khi restart, chỉ bị mất nếu bạn xóa thủ công.

---

Made with ❤️ for family
