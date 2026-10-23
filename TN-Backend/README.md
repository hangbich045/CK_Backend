# 📋 TN-Backend — Express.js + Sequelize + MSSQL

## Tổng quan dự án

Backend Đồ án cuối khóa được xây dựng theo kiến trúc **3 lớp (Layered Architecture)** chuẩn mực, sử dụng:

| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|---------|
| Node.js | ≥18 | Runtime |
| Express.js | ^4.19 | HTTP Framework |
| Sequelize ORM | ^6.37 | Object-Relational Mapper |
| MSSQL (tedious) | ^18.6 | Database driver |
| bcryptjs | ^2.4 | Hash mật khẩu |
| jsonwebtoken | ^9.0 | JWT Authentication |
| swagger-ui-express | ^5.0 | Tài liệu API tự động |
| express-validator | ^7.1 | Validation middleware |

---

## 🗂️ Cấu trúc thư mục

```
TN-Backend/
├── src/
│   ├── server.js              ← Entry point, khởi động server
│   ├── config/
│   │   ├── database.js        ← Kết nối SQL Server bằng Sequelize
│   │   └── swagger.js         ← Cấu hình Swagger UI tại /api-docs
│   ├── models/
│   │   ├── index.js           ← Tập trung associations + sync DB
│   │   ├── User.js            ← Model người dùng (ADMIN/USER)
│   │   ├── EquipmentCategory.js ← Model danh mục thiết bị
│   │   ├── Equipment.js       ← Model thiết bị (FK -> Category)
│   │   ├── BorrowRequest.js   ← Model đơn mượn (FK -> User, Equipment)
│   │   └── StudioBooking.js   ← Model đặt phòng (FK -> User)
│   ├── middlewares/
│   │   ├── auth.middleware.js ← Xác thực JWT + phân quyền RBAC
│   │   └── validate.middleware.js ← Validation với express-validator
│   ├── services/
│   │   ├── auth.service.js    ← Logic đăng ký, đăng nhập, JWT
│   │   ├── equipment.service.js ← Logic CRUD thiết bị + Search/Filter/Pagination
│   │   ├── borrowRequest.service.js ← Logic duyệt đơn + Transaction
│   │   └── studioBooking.service.js ← Logic đặt phòng + kiểm tra trùng lịch
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── equipment.controller.js
│   │   ├── borrowRequest.controller.js
│   │   └── studioBooking.controller.js
│   └── routes/
│       ├── auth.routes.js
│       ├── equipment.routes.js
│       ├── borrowRequest.routes.js
│       ├── studioBooking.routes.js
│       └── category.routes.js
├── .env                       ← Biến môi trường (KHÔNG commit lên git)
├── .env.example               ← Template .env
├── package.json
└── README.md
```

---

## 🗄️ Sơ đồ quan hệ Database (ERD)

```
EquipmentCategories (1) ─────────── (N) Equipments
       id (PK)                              id (PK)
       name                                 code
       description                          name
                                            category_id (FK)
                                            quantity
                                            available_quantity
                                            status [AVAILABLE/BORROWED/MAINTENANCE]

Users (1) ──────────────────────── (N) BorrowRequests
   id (PK, UUID)                          id (PK, UUID)
   full_name                              user_id (FK -> Users)
   email (UNIQUE)                         equipment_id (FK -> Equipments)
   password (HASHED)                      quantity
   employee_code                          purpose
   role [ADMIN/USER]                      borrow_date
   is_active                              return_date
                                          actual_return_date
                     ┌─────────────────── status [PENDING/APPROVED/REJECTED/RETURNED]
                     │
Users (1) ──────────┘───────────── (N) StudioBookings
                                         id (PK, UUID)
                                         user_id (FK -> Users)
                                         studio_name
                                         purpose
                                         start_time
                                         end_time
                                         status [PENDING/CONFIRMED/COMPLETED/CANCELLED]
```

---

## 🚀 Hướng dẫn cài đặt & chạy

### Bước 1: Cài dependencies
```bash
npm install
```

### Bước 2: Cấu hình database
Mở file `.env` và điền thông tin SQL Server:
```env
DB_HOST=localhost
DB_PORT=1433
DB_NAME=TN_Database        # Tên database (tạo trước trong SQL Server)
DB_USER=sa
DB_PASSWORD=YourPassword   # Mật khẩu SQL Server
DB_TRUST_SERVER_CERTIFICATE=true   # Bắt buộc cho local development
JWT_SECRET=change_this_to_a_long_random_string
```

### Bước 3: Tạo database trong SQL Server
```sql
-- Chạy trong SQL Server Management Studio (SSMS):
CREATE DATABASE TN_Database;
```

> **Lưu ý**: Sequelize sẽ tự tạo bảng khi server khởi động (`sequelize.sync({ alter: true })`).
> Bạn KHÔNG cần tạo bảng thủ công.

### Bước 4: Khởi động server
```bash
npm run dev    # Development (auto-reload với nodemon)
npm start      # Production
```

### Bước 5: Kiểm tra
- 🖥️ Server: http://localhost:5000
- 📄 Swagger UI: http://localhost:5000/api-docs
- 🔍 Health Check: http://localhost:5000/health

---

## 📡 Danh sách API Endpoints

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/api/auth/register` | ❌ Public | Đăng ký tài khoản |
| POST | `/api/auth/login` | ❌ Public | Đăng nhập → JWT Token |
| GET | `/api/auth/profile` | ✅ Login | Lấy profile của mình |
| PATCH | `/api/auth/profile` | ✅ Login | Cập nhật profile |
| GET | `/api/auth/users` | 👑 Admin | Danh sách tất cả users |

### 🔧 Thiết bị (`/api/equipments`)

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/api/equipments` | ✅ Login | Danh sách (search/filter/pagination) |
| GET | `/api/equipments/:id` | ✅ Login | Chi tiết thiết bị |
| POST | `/api/equipments` | 👑 Admin | Thêm thiết bị mới |
| PATCH | `/api/equipments/:id` | 👑 Admin | Cập nhật thiết bị |
| DELETE | `/api/equipments/:id` | 👑 Admin | Xóa thiết bị |

### 📦 Đơn mượn (`/api/borrow-requests`)

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/api/borrow-requests` | ✅ Login | Danh sách đơn (RBAC) |
| POST | `/api/borrow-requests` | ✅ Login | Tạo đơn mượn mới |
| PATCH | `/api/borrow-requests/:id/process` | 👑 Admin | Duyệt/Từ chối |
| PATCH | `/api/borrow-requests/:id/return` | ✅ Login | Xác nhận trả |

### 🎬 Studio (`/api/studio-bookings`)

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/api/studio-bookings` | ✅ Login | Danh sách booking |
| POST | `/api/studio-bookings` | ✅ Login | Đặt phòng |
| PATCH | `/api/studio-bookings/:id/process` | 👑 Admin | Xác nhận/Huỷ |
| PATCH | `/api/studio-bookings/:id/cancel` | ✅ Login | Tự huỷ |

### 📂 Danh mục (`/api/categories`)

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/api/categories` | ✅ Login | Danh sách danh mục |
| POST | `/api/categories` | 👑 Admin | Tạo danh mục |
| DELETE | `/api/categories/:id` | 👑 Admin | Xóa danh mục |

---

## 🔍 Tìm kiếm, Lọc và Phân trang (Query Parameters)

Các API danh sách hỗ trợ đầy đủ:

```http
GET /api/equipments?search=canon&categoryId=1&status=AVAILABLE&page=1&limit=10
```

| Param | Kiểu | Mô tả |
|-------|------|-------|
| `search` | string | Tìm theo tên/mã (SQL LIKE) |
| `categoryId` | number | Lọc theo danh mục |
| `status` | string | Lọc theo trạng thái |
| `page` | number | Số trang (default: 1) |
| `limit` | number | Số item/trang (default: 10) |

**Response format:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

## 🔐 Xác thực JWT

### Đăng nhập:
```http
POST /api/auth/login
Content-Type: application/json

{ "email": "admin@example.com", "password": "Password123" }
```

### Sử dụng token:
```http
GET /api/equipments
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🏗️ Kiến trúc Layered (3 lớp)

```
HTTP Request
     ↓
  ROUTES          ← Định nghĩa endpoint URL + method
     ↓
MIDDLEWARES        ← authenticate() → authorize() → validate()
     ↓
CONTROLLERS        ← Nhận req, gọi service, trả res (KHÔNG có business logic)
     ↓
SERVICES           ← Toàn bộ Business Logic, kiểm tra điều kiện nghiệp vụ
     ↓
MODELS (Sequelize) ← Tương tác với SQL Server (CRUD, query, transaction)
     ↓
  SQL Server
```

---

## 💡 Giải thích kỹ thuật quan trọng

### 1. bcryptjs - Hash mật khẩu
```js
const hashedPassword = await bcrypt.hash(password, 10); // 10 = saltRounds
const isValid = await bcrypt.compare(plaintext, hashedPassword); // So sánh
```
- `saltRounds=10`: ~100ms để hash → đủ chậm để brute-force khó khăn
- Mỗi lần hash tạo salt ngẫu nhiên → cùng mật khẩu có hash khác nhau

### 2. JWT - JSON Web Token
```js
const token = jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '7d' });
const decoded = jwt.verify(token, JWT_SECRET); // Xác minh + giải mã
```
- 3 phần: `header.payload.signature` (đều base64)
- Signature đảm bảo token không bị giả mạo
- Client lưu token → gửi trong `Authorization: Bearer <token>`

### 3. Sequelize Op (Operators)
```js
const { Op } = require('sequelize');
where[Op.like] = `%${search}%`;  // SQL: LIKE '%...%'
where[Op.or]   = [...]           // SQL: OR
where[Op.between] = [start, end] // SQL: BETWEEN
```

### 4. Sequelize Transaction
```js
const result = await sequelize.transaction(async (t) => {
  await ModelA.update(data1, { transaction: t });
  await ModelB.update(data2, { transaction: t });
  // Nếu 1 trong 2 lỗi -> tự động ROLLBACK cả 2
}); // Nếu không lỗi -> tự động COMMIT
```

### 5. Eager Loading (JOIN)
```js
Equipment.findAll({
  include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }]
});
// SQL: SELECT e.*, c.id, c.name FROM Equipments e LEFT JOIN EquipmentCategories c ON...
```
