# 📦 TN-Backend — Tài liệu Dự án

> **Hệ thống quản lý thiết bị & đặt phòng studio** — LHU Media Studio  
> Đồ án cuối khóa | Node.js + Express.js + SQL Server + Sequelize ORM

---

## 🛠️ Tech Stack

| Thành phần | Công nghệ | Ghi chú |
|-----------|-----------|---------|
| **Runtime** | Node.js v24+ | JavaScript runtime |
| **Framework** | Express.js ^4.x | RESTful API server |
| **Database** | Microsoft SQL Server 2019+ | MSSQL (cài local) |
| **ORM** | Sequelize ^6.x | Kết nối + ánh xạ bảng |
| **Driver** | `tedious` | MSSQL driver cho Node |
| **Auth** | JSON Web Token (JWT) | Stateless authentication |
| **Mã hóa** | bcryptjs | Hash mật khẩu (saltRounds=10) |
| **Upload ảnh** | Cloudinary v3 | Cloud image/video storage |
| **File parser** | Multer + multer-storage-cloudinary | Upload multipart/form-data |
| **Email** | Nodemailer + Gmail SMTP | Gửi OTP xác thực |
| **Excel export** | ExcelJS ^4.x | Xuất báo cáo .xlsx |
| **Validation** | express-validator | Request validation middleware |
| **API Docs** | Swagger UI (swagger-jsdoc) | `/api-docs` |
| **Dev server** | nodemon | Auto-restart khi thay đổi |
| **Env** | dotenv | Biến môi trường từ `.env` |

---

## 📁 Cấu trúc thư mục

```
TN-Backend/
├── .env                               ← Biến môi trường (KHÔNG commit)
├── migrate.js                         ← Script ALTER TABLE an toàn cho MSSQL
├── package.json
└── src/
    ├── server.js                      ← Entry point: Express + register routes
    ├── config/
    │   ├── database.js                ← Sequelize + MSSQL connection
    │   ├── swagger.js                 ← Swagger UI setup
    │   ├── cloudinary.js              ← Cloudinary SDK + Multer (4 storage types)
    │   └── mailer.js                  ← Nodemailer SMTP + HTML email template
    ├── models/
    │   ├── index.js                   ← Associations (hasMany/belongsTo) + sync DB
    │   ├── User.js                    ← Users (id, email, password, role, otp...)
    │   ├── EquipmentCategory.js       ← EquipmentCategories
    │   ├── Equipment.js               ← Equipments (FK → Category)
    │   ├── BorrowRequest.js           ← BorrowRequests (FK → User, Equipment)
    │   └── StudioBooking.js           ← StudioBookings (FK → User)
    ├── middlewares/
    │   ├── auth.middleware.js         ← authenticate() JWT + authorize() RBAC
    │   └── validate.middleware.js     ← express-validator rules
    ├── services/
    │   ├── auth.service.js            ← bcrypt + JWT
    │   ├── equipment.service.js       ← CRUD + Search/Filter/Pagination
    │   ├── borrowRequest.service.js   ← Workflow + Sequelize Transaction
    │   └── studioBooking.service.js   ← Booking + conflict check
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── equipment.controller.js
    │   ├── borrowRequest.controller.js
    │   └── studioBooking.controller.js
    └── routes/
        ├── auth.routes.js             ← register/login/verify/forgot/reset
        ├── equipment.routes.js        ← CRUD thiết bị
        ├── borrowRequest.routes.js    ← Mượn/trả + approve/reject
        ├── studioBooking.routes.js    ← Đặt phòng + approve/reject
        ├── category.routes.js         ← Danh mục thiết bị
        ├── upload.routes.js           ← Cloudinary upload
        ├── dashboard.routes.js        ← Thống kê + biểu đồ admin
        ├── reports.routes.js          ← Xuất Excel báo cáo
        ├── cms.routes.js              ← Nội dung trang chủ (CMS)
        ├── homepage.routes.js         ← API trang chủ public
        ├── admin.routes.js            ← Quản lý users (ADMIN)
        └── compat.routes.js           ← Routes tương thích FE NestJS-style
```

---

## 🔑 Biến môi trường (`.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# Database MSSQL
DB_HOST=localhost
DB_PORT=1433
DB_NAME=TN_Database
DB_USER=sa
DB_PASSWORD=Admin@123
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# JWT
JWT_SECRET=<secret_key_dài_ít_nhất_32_ký_tự>
JWT_EXPIRES_IN=7d

# Cloudinary (Upload ảnh cloud)
CLOUDINARY_CLOUD_NAME=cjbjpbfm
CLOUDINARY_API_KEY=333448235176296
CLOUDINARY_API_SECRET=oCXojI0ygh3ZdTccGxBogFx3suQ

# SMTP Gmail (Gửi email OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=hangbich045@gmail.com
SMTP_PASS=wdhm prib luzi zojq
SMTP_FROM="LHU Media Studio <hangbich045@gmail.com>"

# CORS
FRONTEND_URL=http://localhost:3000
```

---

## 🗺️ API Endpoints

### Auth — `/api/auth`
| Method | Endpoint | Auth | Chức năng |
|--------|----------|------|-----------|
| POST | `/register` | ❌ Public | Đăng ký → gửi OTP email |
| POST | `/login` | ❌ Public | Đăng nhập → JWT token |
| POST | `/verify` | ❌ Public | Xác thực OTP → đăng nhập luôn |
| POST | `/resend-otp` | ❌ Public | Gửi lại OTP |
| POST | `/forgot-password` | ❌ Public | Gửi OTP reset password |
| POST | `/reset-password` | ❌ Public | Đặt lại mật khẩu |
| GET | `/profile` | ✅ User | Lấy thông tin cá nhân |
| PATCH/PUT | `/profile` | ✅ User | Cập nhật profile |
| GET | `/users` | 🔐 ADMIN | Danh sách tất cả users |

### Upload — `/api`
| Method | Endpoint | Auth | Chức năng |
|--------|----------|------|-----------|
| POST | `/equipment/upload` | 🔐 ADMIN | Upload ảnh thiết bị → Cloudinary |
| POST | `/auth/avatar` | ✅ User | Upload avatar + cập nhật DB |
| POST | `/gallery/upload` | 🔐 ADMIN | Upload ảnh gallery |
| POST | `/cms/upload/video` | 🔐 ADMIN | Upload video |
| POST | `/cms/upload/poster` | 🔐 ADMIN | Upload thumbnail |

### Equipment — `/api/equipment`
| Method | Endpoint | Auth | Chức năng |
|--------|----------|------|-----------|
| GET | `/` | ✅ | Danh sách + search/filter/paginate |
| GET | `/:id` | ✅ | Chi tiết thiết bị |
| POST | `/` | 🔐 ADMIN | Tạo thiết bị |
| PUT | `/:id` | 🔐 ADMIN | Cập nhật |
| DELETE | `/:id` | 🔐 ADMIN | Xóa |

### Borrow Requests — `/api/borrow-requests`
| Method | Endpoint | Auth | Chức năng |
|--------|----------|------|-----------|
| GET | `/` | ✅ | Danh sách (USER: của mình, ADMIN: tất cả) |
| POST | `/` | ✅ | Tạo đơn mượn |
| PUT | `/:id/approve` | 🔐 ADMIN | Duyệt đơn |
| PUT | `/:id/reject` | 🔐 ADMIN | Từ chối đơn |
| PUT | `/:id/return` | ✅ | Xác nhận trả thiết bị |

### Studio Booking — `/api/studio-bookings`
| Method | Endpoint | Auth | Chức năng |
|--------|----------|------|-----------|
| GET | `/` | ✅ | Danh sách đặt phòng |
| POST | `/` | ✅ | Đặt phòng (kiểm tra trùng lịch tự động) |
| PUT | `/:id/approve` | 🔐 ADMIN | Xác nhận booking |
| PUT | `/:id/reject` | 🔐 ADMIN | Từ chối booking |

### Dashboard — `/api/dashboard` (🔐 ADMIN)
| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| GET | `/stats` | Tổng quan: thiết bị, đơn chờ, users |
| GET | `/reports?range=month\|week\|year\|custom` | Biểu đồ + top thiết bị mượn nhiều |

### Reports — `/api/reports` (🔐 ADMIN)
| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| GET | `/export-excel?range=...` | Xuất file .xlsx 4 sheet |

---

## 🗄️ Database Schema

```
Users
  id UUID PK | email UNIQUE | password (bcrypt) | fullName | role (ADMIN/USER)
  employeeCode | phone | avatarUrl | isActive | isVerified | otpCode | otpExpiry
  created_at | updated_at

EquipmentCategories
  id UUID PK | name | description | created_at

Equipments
  id UUID PK | name | code UNIQUE | description | quantity | status (AVAILABLE/BORROWED/MAINTENANCE)
  imageUrl | categoryId FK→EquipmentCategories | created_at

BorrowRequests
  id UUID PK | userId FK→Users | equipmentId FK→Equipments
  quantity | purpose | borrowDate | returnDate
  status (PENDING/APPROVED/REJECTED/RETURNED) | rejectReason | created_at

StudioBookings
  id UUID PK | userId FK→Users | studioName | fullName
  purpose | startTime | endTime | attendees
  status (PENDING/CONFIRMED/CANCELLED/COMPLETED) | cancelReason | notes | created_at
```

**Quan hệ (Sequelize Associations):**
- `User` **hasMany** `BorrowRequest` (as `'requester'`)
- `User` **hasMany** `StudioBooking` (as `'booker'`)
- `Equipment` **hasMany** `BorrowRequest` (as `'equipment'`)
- `EquipmentCategory` **hasMany** `Equipment` (as `'category'`)

---

## 🚀 Cài đặt & Chạy

### Yêu cầu hệ thống
- Node.js v18+
- SQL Server 2019+ (đang chạy, port 1433)
- Database `TN_Database` đã tạo

### Lần đầu setup

```bash
# 1. Tạo database trong SSMS:
CREATE DATABASE TN_Database;

# 2. Cài dependencies
cd G:\2.CODE\CK-BE\TN-Backend
npm install

# 3. Chạy migration (tạo các column bổ sung)
node migrate.js

# 4. Tạo tài khoản Admin
node -e "
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('./src/config/database');
const { User } = require('./src/models');
(async () => {
  await sequelize.authenticate();
  const hash = await bcrypt.hash('Admin@123', 10);
  const [u, c] = await User.findOrCreate({
    where: { email: 'admin@lhu.edu.vn' },
    defaults: { email: 'admin@lhu.edu.vn', password: hash, fullName: 'Admin LHU',
                role: 'ADMIN', isVerified: true, isActive: true }
  });
  if (!c) await u.update({ password: hash, isVerified: true, role: 'ADMIN' });
  console.log(c ? 'Admin created' : 'Admin updated'); process.exit(0);
})();
"

# 5. Chạy dev server
npm run dev
```

### Kiểm tra hoạt động
```
✅ Kết nối SQL Server thành công!
✅ Database đã được đồng bộ thành công!
✅ SMTP Mailer đã kết nối thành công!

======================================
🚀 Server: http://localhost:5000
📡 API:     http://localhost:5000/api
📤 Cloudinary: ✅ Đã cấu hình
📧 SMTP:    ✅ hangbich045@gmail.com
📄 Swagger: http://localhost:5000/api-docs
======================================
```

---

## 📋 Checklist yêu cầu đồ án

| Yêu cầu kỹ thuật | ✅ | File triển khai |
|-----------------|---|----------------|
| Node.js + Express.js | ✅ | `server.js` |
| SQL Server + Sequelize ORM | ✅ | `config/database.js`, `models/` |
| Kiến trúc 3 lớp (Controller / Service / Model) | ✅ | `controllers/`, `services/`, `models/` |
| Middleware Authentication (JWT) | ✅ | `auth.middleware.js` → `authenticate()` |
| Middleware Phân quyền RBAC (ADMIN/USER) | ✅ | `auth.middleware.js` → `authorize()` |
| Middleware Validation | ✅ | `validate.middleware.js` |
| bcrypt hash mật khẩu | ✅ | `services/auth.service.js` |
| Đăng ký / Đăng nhập → JWT Token | ✅ | `routes/auth.routes.js` |
| Gửi email OTP (Nodemailer) | ✅ | `config/mailer.js` |
| Upload ảnh lên Cloudinary | ✅ | `config/cloudinary.js` + `routes/upload.routes.js` |
| Quan hệ 1-N (hasMany / belongsTo) | ✅ | `models/index.js` — 4 quan hệ |
| Tìm kiếm với Op.like | ✅ | `services/equipment.service.js` |
| Lọc theo field | ✅ | Tất cả `service.findAll()` |
| Phân trang (limit/offset) | ✅ | Tất cả `findAndCountAll()` |
| Sequelize Transaction | ✅ | `services/borrowRequest.service.js` |
| Swagger /api-docs | ✅ | `config/swagger.js` + JSDoc controllers |
| RESTful API cho Next.js Frontend | ✅ | Toàn bộ routes |
| Xuất báo cáo Excel | ✅ | `routes/reports.routes.js` (ExcelJS) |

---

## 🎓 Giải trình trước hội đồng

### 1. Kiến trúc 3 lớp
```
HTTP Request
    ↓
[Route] — định nghĩa URL + method + middleware chain
    ↓
[Middleware] — JWT authenticate → RBAC authorize → express-validator validate
    ↓
[Controller] — nhận req/res, gọi service, trả response
    ↓
[Service] — toàn bộ business logic (không biết req/res)
    ↓
[Model] — Sequelize ánh xạ trực tiếp với bảng SQL Server
    ↓
SQL Server Database
```

### 2. Bảo mật đúng chuẩn
- **bcryptjs** `saltRounds=10` → ~100ms/hash, chống brute-force
- **JWT** payload tối thiểu `{id, email, role}`, expire 7d
- **OTP 6 số** expire 10 phút (verify email & reset password)
- **User enumeration prevention**: `forgot-password` luôn trả 200 kể cả email không tồn tại

### 3. Sequelize Transaction (ACID)
```js
// Khi duyệt đơn mượn: cập nhật 2 bảng phải atomic
const t = await sequelize.transaction();
try {
  await BorrowRequest.update({ status: 'APPROVED' }, { where: { id }, transaction: t });
  await Equipment.update({ status: 'BORROWED' }, { where: { id: equipmentId }, transaction: t });
  await t.commit();   // Cả 2 OK → commit
} catch (err) {
  await t.rollback(); // 1 bước lỗi → rollback toàn bộ
}
```

### 4. MSSQL Compatibility (khác MySQL/PostgreSQL)
- Dùng `STRING` thay `ENUM` (MSSQL không hỗ trợ ENUM natively)
- `force: false` thay `alter: true` (MSSQL lỗi ALTER TABLE có unique constraint)
- Raw SQL cho `GROUP BY + ORDER BY + COUNT(*)` (MSSQL strict mode)
- `migrate.js` để `ALTER TABLE` an toàn với `IF NOT EXISTS` check

### 5. Tìm kiếm / Lọc / Phân trang
```js
const { count, rows } = await Equipment.findAndCountAll({
  where: {
    ...(keyword && { name: { [Op.like]: `%${keyword}%` } }),  // chỉ thêm khi có
    ...(status  && { status }),
    ...(catId   && { categoryId: catId }),
  },
  limit, offset,
  order: [['created_at', 'DESC']],
  // → 1 query lấy data + total count (hiệu quả hơn 2 query)
});
```
