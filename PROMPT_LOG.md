### Prompt 01 – Thiết kế kiến trúc phân tầng Layered Architecture cho Express.js Backend

```text
Tôi đang xây dựng hệ thống Backend RESTful API bằng Node.js và Express.js cho dự án Quản lý thiết bị và đặt phòng Studio (LHU Media Studio), kết nối cơ sở dữ liệu Microsoft SQL Server thông qua Sequelize ORM.

Hãy thiết kế cấu trúc thư mục hoàn chỉnh theo mô hình Layered Architecture phân tách rõ ràng các tầng trách nhiệm:
1. Routes (src/routes/): Định nghĩa URI, phương thức HTTP và gắn middleware.
2. Middlewares (src/middlewares/): Xử lý xác thực JWT, phân quyền RBAC và validate dữ liệu đầu vào.
3. Controllers (src/controllers/): Tiếp nhận request, phân giải tham số và trả về response mã HTTP chuẩn.
4. Services (src/services/): Chứa toàn bộ business logic nghiệp vụ, hoàn toàn độc lập với req/res của Express để dễ dàng viết Unit Test.
5. Models (src/models/): Định nghĩa schema bảng và quan hệ giữa các bảng.
6. Config (src/config/): Cấu hình database kết nối MSSQL, Swagger và các dịch vụ ngoài.

Yêu cầu:
- File entry point src/server.js cấu hình CORS hỗ trợ Frontend Next.js (localhost:3000), parse JSON payload 10MB và Global Error Handler bắt lỗi tập trung.
- Tránh circular dependency khi các model import lẫn nhau.
```

### Prompt 02 – Thiết kế Schema Database và Quan hệ Bảng Sequelize ORM kết nối MSSQL

```text
Dự án TN-Backend sử dụng Sequelize ORM v6 kết nối cơ sở dữ liệu Microsoft SQL Server (MSSQL). Tôi cần thiết kế cơ sở dữ liệu cho hệ thống LHU Media Studio gồm 5 thực thể: User, EquipmentCategory, Equipment, BorrowRequest, StudioBooking.

Hãy viết mã nguồn định nghĩa các model Sequelize và file src/models/index.js thiết lập quan hệ giữa các bảng:
1. User: id (UUID PK), email (UNIQUE), password (hash), fullName, employeeCode, role (ADMIN/USER), isActive (boolean).
2. EquipmentCategory: id (INT PK IDENTITY), name (UNIQUE), description.
3. Equipment: id (UUID PK), code (UNIQUE), name, categoryId (FK), quantity, availableQuantity (min: 0), status (AVAILABLE/BORROWED/MAINTENANCE), imageUrl, location.
4. BorrowRequest: id (UUID PK), userId (FK), equipmentId (FK), quantity, purpose, borrowDate, returnDate, status (PENDING/APPROVED/REJECTED/RETURNED), rejectionReason.
5. StudioBooking: id (UUID PK), userId (FK), studioName, fullName, purpose, startTime, endTime, attendees, status (PENDING/CONFIRMED/CANCELLED/COMPLETED), cancelReason.

Yêu cầu kỹ thuật:
- Thiết lập quan hệ 1-N đầy đủ hasMany và belongsTo giữa các thực thể.
- Ràng buộc: Xóa Category phải bị chặn nếu còn Equipment (onDelete: 'RESTRICT'); xóa User thì cascade đơn mượn và đặt phòng (onDelete: 'CASCADE').
- MSSQL không hỗ trợ ENUM native, hãy sử dụng DataTypes.STRING(20) kết hợp validator isIn ở tầng Sequelize model.
- Thiết lập hàm syncDatabase() sử dụng { force: false } để tránh lỗi cú pháp ALTER TABLE trên SQL Server.
```

### Prompt 03 – Triển khai Xác thực JWT và Mã hóa Mật khẩu với Bcrypt

```text
Tôi đang xây dựng module xác thực cho hệ thống TN-Backend. Hãy viết mã nguồn cho src/services/auth.service.js và src/controllers/auth.controller.js thực hiện các chức năng:

1. Đăng ký tài khoản (register):
- Tiếp nhận: fullName, email, password, employeeCode, phone.
- Kiểm tra trùng lặp email và employeeCode trong bảng Users.
- Mã hóa mật khẩu bằng thư viện bcryptjs với saltRounds = 10.
- Tài khoản đầu tiên đăng ký tự động gán role 'ADMIN', các tài khoản tiếp theo gán role 'USER'.
- Trả về thông tin người dùng đã tạo, tuyệt đối loại bỏ trường password khỏi dữ liệu phản hồi.

2. Đăng nhập hệ thống (login):
- Tiếp nhận: email, password.
- Tìm user theo email và so khớp mật khẩu bằng bcrypt.compare.
- Kiểm tra trạng thái tài khoản isActive, từ chối nếu tài khoản bị khóa.
- Ký phát JWT token với payload tối thiểu { id, email, role } sử dụng JWT_SECRET và JWT_EXPIRES_IN (mặc định '7d').
- Trả về token và thông tin profile cơ bản của người dùng.

Yêu cầu bảo mật:
- Khi email hoặc mật khẩu không đúng, chỉ trả về một thông báo lỗi duy nhất: "Email hoặc mật khẩu không chính xác" (HTTP 401) để chống kỹ thuật tấn công dò quét người dùng (User Enumeration).
```

### Prompt 04 – Xây dựng Middleware Xác thực JWT và Phân quyền RBAC

```text
Hệ thống Express.js cần cơ chế bảo vệ endpoint và phân quyền người dùng (Role-Based Access Control) qua HTTP Header `Authorization: Bearer <token>`.

Hãy viết file src/middlewares/auth.middleware.js chứa 2 middleware:

1. Middleware authenticate:
- Trích xuất token từ header Authorization, kiểm tra định dạng Bearer token.
- Sử dụng jwt.verify() với biến môi trường JWT_SECRET để giải mã.
- Truy vấn database kiểm tra người dùng còn tồn tại và isActive === true.
- Gắn payload thông tin người dùng vào req.user = { id, email, fullName, role } và gọi next().
- Bắt và phân biệt rõ mã lỗi: TokenExpiredError (token hết hạn -> 401), JsonWebTokenError (token sai chữ ký -> 401).

2. Middleware authorize(...roles):
- Là một Higher-Order Function nhận danh sách các quyền được phép (ví dụ: authorize('ADMIN') hoặc authorize('ADMIN', 'USER')).
- Kiểm tra req.user.role có nằm trong danh sách quyền hợp lệ hay không.
- Nếu không đủ quyền, ngắt request và trả về HTTP 403 Forbidden kèm thông báo: "Bạn không có quyền truy cập. Chức năng này yêu cầu quyền: [danh sách roles]".
- Nếu chưa qua bước authenticate (req.user không tồn tại), trả về HTTP 401 Unauthorized.
```

### Prompt 05 – Xây dựng Nghiệp vụ Mượn/Trả Thiết bị với Sequelize Managed Transaction

```text
Trong hệ thống TN-Backend, nghiệp vụ duyệt đơn mượn thiết bị (BorrowRequest) tác động trực tiếp đến số lượng tồn kho khả dụng (availableQuantity) trong bảng Equipments. Hãy viết hàm processRequest(requestId, action, rejectionReason) trong src/services/borrowRequest.service.js để đảm bảo tính toàn vẹn dữ liệu:

Yêu cầu nghiệp vụ:
1. Bọc toàn bộ quá trình xử lý trong một Sequelize Managed Transaction: `sequelize.transaction(async (t) => { ... })`.
2. Truy vấn đơn mượn theo requestId kèm include thông tin Equipment, áp dụng khóa dòng `lock: t.LOCK.UPDATE` để chống xung đột dữ liệu (race condition) khi nhiều admin cùng thao tác.
3. Kiểm tra trạng thái đơn: Chỉ xử lý các đơn đang ở trạng thái 'PENDING'.
4. Trường hợp duyệt đơn (action === 'approve'):
   - Kiểm tra lại tồn kho: `equipment.availableQuantity >= request.quantity`. Nếu không đủ, ném lỗi HTTP 400.
   - Cập nhật đơn mượn sang trạng thái 'APPROVED'.
   - Trừ số lượng khả dụng của thiết bị: `newAvailable = availableQuantity - request.quantity`.
   - Cập nhật bảng Equipments với availableQuantity mới; nếu newAvailable === 0 thì chuyển status thành 'BORROWED'.
5. Trường hợp từ chối (action === 'reject'):
   - Cập nhật đơn mượn sang trạng thái 'REJECTED' và lưu lại lý do từ chối (rejectionReason).
6. Mọi thao tác truy vấn và cập nhật phải truyền transaction object `{ transaction: t }`. Nếu xảy ra bất kỳ lỗi nào, transaction phải tự động rollback toàn bộ.
```

### Prompt 06 – Thuật toán Kiểm tra Xung đột Thời gian Đặt phòng Studio

```text
Tôi đang xây dựng tính năng đặt phòng Studio (StudioBooking) trong src/services/studioBooking.service.js. Một phòng Studio tại một thời điểm chỉ phục vụ một đoàn làm việc đã được xác nhận.

Hãy viết hàm create(data, userId) có thuật toán phát hiện xung đột lịch đặt phòng (Schedule Conflict Check):
1. Nhận thông tin: studioName, startTime (DateTime), endTime (DateTime), attendees, purpose.
2. Kiểm tra xung đột với các đơn đã được duyệt (status === 'CONFIRMED') của cùng studioName trong khoảng thời gian mới [newStart, newEnd]:
   - Khoảng thời gian cũ bắt đầu trong khung giờ mới: `startTime BETWEEN newStart AND newEnd`.
   - Khoảng thời gian cũ kết thúc trong khung giờ mới: `endTime BETWEEN newStart AND newEnd`.
   - Khoảng thời gian cũ bao trùm toàn bộ khung giờ mới: `startTime <= newStart AND endTime >= newEnd`.
3. Chuyển đổi điều kiện toán học trên thành truy vấn Sequelize sử dụng toán tử `Op.or` kết hợp với `Op.between`, `Op.lte`, `Op.gte`.
4. Nếu phát hiện lịch bị trùng, ném lỗi HTTP 409 Conflict với thông báo: "Phòng [studioName] đã được đặt trong khung giờ này. Vui lòng chọn thời gian khác."
5. Nếu không trùng lịch, tạo mới bản ghi StudioBooking với trạng thái mặc định 'PENDING'.

Lưu ý: Hai ca thời gian liền kề (ca sau bắt đầu đúng thời điểm ca trước kết thúc, ví dụ 08:00 - 10:00 và 10:00 - 12:00) được tính là hợp lệ, không bị coi là xung đột.
```

### Prompt 07 – Xây dựng Bộ lọc Đa tiêu chí, Tìm kiếm Mờ và Phân trang Tối ưu

```text
Hãy viết hàm findAll(query) trong src/services/equipment.service.js cho API lấy danh sách thiết bị `GET /api/equipments`:

Yêu cầu triển khai:
1. Phân trang dữ liệu:
   - Tiếp nhận `page` (mặc định 1) và `limit` (mặc định 10).
   - Chuẩn hóa dữ liệu đầu vào tránh số âm hoặc chuỗi rác: `currentPage = Math.max(1, parseInt(page) || 1)`, `pageLimit = Math.max(1, parseInt(limit) || 10)`.
   - Tính toán vị trí bắt đầu: `offset = (currentPage - 1) * pageLimit`.
2. Tìm kiếm và lọc linh hoạt (Dynamic Where Clause):
   - Tìm kiếm từ khóa (keyword hoặc search): Sử dụng toán tử `[Op.or]` tìm kiếm mờ `[Op.like]: '%keyword%'` trên cả 2 trường `name` và `code`.
   - Lọc theo danh mục: Thêm điều kiện `{ categoryId }` nếu client truyền lên.
   - Lọc theo trạng thái: Thêm điều kiện `{ status }` nếu client truyền lên.
3. Truy vấn tối ưu:
   - Sử dụng `Equipment.findAndCountAll()` để vừa lấy danh sách dữ liệu vừa lấy tổng số bản ghi trong một câu truy vấn duy nhất.
   - Eager loading nạp kèm model EquipmentCategory (as: 'category') lấy tên danh mục.
   - Sắp xếp kết quả mới nhất lên đầu: `order: [['created_at', 'DESC']]`.
4. Trả về cấu trúc phản hồi JSON:
   `{ items, total, page, limit, totalPages: Math.ceil(total / limit) }`.
```

### Prompt 08 – Tích hợp Upload Đa phương tiện lên Cloudinary với Multer và Local Fallback

```text
Tôi cần xây dựng module upload hình ảnh thiết bị và avatar người dùng cho hệ thống TN-Backend.

Hãy viết mã nguồn cho src/config/cloudinary.js và src/routes/upload.routes.js:
1. Cấu hình Cloudinary SDK sử dụng các biến môi trường: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
2. Xây dựng hàm createStorage(folder, allowedFormats) sử dụng `multer-storage-cloudinary` với cấu hình tự động tối ưu hóa hình ảnh: thư mục lưu trữ `lhu-media/{folder}`, kích thước giới hạn tối đa 1200x1200px, crop 'limit', quality 'auto'.
3. Khởi tạo các instance Multer:
   - uploadEquipment: Thư mục 'equipment', định dạng jpg/png/webp, dung lượng tối đa 5MB.
   - uploadAvatar: Thư mục 'avatars', định dạng jpg/png/webp, dung lượng tối đa 2MB.
4. Xây dựng các route upload:
   - `POST /api/equipment/upload`: Yêu cầu quyền ADMIN, upload ảnh thiết bị lên Cloudinary và trả về URL ảnh.
   - `POST /api/auth/avatar`: Cho phép User đăng nhập upload avatar cá nhân, tự động cập nhật trường `avatarUrl` vào bảng Users trong cơ sở dữ liệu.
5. Xử lý lỗi Multer: Bắt mã lỗi `LIMIT_FILE_SIZE` trả về HTTP 400 "File quá lớn. Vui lòng chọn file nhỏ hơn."
6. Cấu hình express.static trong src/server.js phục vụ thư mục `/uploads` làm phương án dự phòng cục bộ (local fallback).
```

### Prompt 09 – Xuất Báo cáo Thống kê Tổng hợp Nhiều Sheet ra File Excel với ExcelJS

```text
Tôi muốn xây dựng API kết xuất báo cáo thống kê dành cho quản trị viên `GET /api/reports/export-excel` trong src/routes/reports.routes.js sử dụng thư viện ExcelJS.

Yêu cầu kỹ thuật:
1. Bảo mật: Endpoint yêu cầu xác thực JWT và chỉ cho phép người dùng có role 'ADMIN'.
2. Tiếp nhận tham số lọc thời gian qua query parameters: `range` ('month', 'week', 'year', 'custom'), `startDate`, `endDate`.
3. Truy vấn dữ liệu thực tế từ database: Bảng tổng hợp KPIs, danh sách đơn mượn (BorrowRequests kèm User và Equipment), danh sách đặt phòng Studio (StudioBookings kèm User), danh sách thiết bị kho (Equipments kèm Category).
4. Tạo một Excel Workbook gồm 4 Worksheets chuyên biệt:
   - Sheet 1 "Tổng quan": Báo cáo chỉ số tổng hợp (Tổng thiết bị, thiết bị đang cho mượn, đơn mượn chờ duyệt, tổng lịch đặt phòng).
   - Sheet 2 "Đơn mượn thiết bị": Cột Mã đơn, Người mượn, Email, Tên thiết bị, Số lượng mượn, Ngày mượn, Ngày trả, Trạng thái đơn.
   - Sheet 3 "Đặt phòng Studio": Cột Mã đặt phòng, Người đặt, Phòng Studio, Bắt đầu, Kết thúc, Số người tham gia, Trạng thái.
   - Sheet 4 "Thiết bị": Cột Mã thiết bị, Tên thiết bị, Danh mục, Tổng số lượng kho, Số lượng khả dụng, Trạng thái kho.
5. Định dạng bảng tính chuyên nghiệp:
   - Dòng tiêu đề in đậm, căn giữa, có màu nền chủ đạo và viền ô (border).
   - Tự động tính toán độ rộng cột (auto-fit column width) dựa trên độ dài nội dung.
6. Thiết lập HTTP Response Headers để tải file trực tiếp: Content-Type `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` và Content-Disposition `attachment; filename="Bao-cao-LHU-Media-[timestamp].xlsx"`.
```

### Prompt 10 – Tạo Tài liệu API Tương tác với Swagger / OpenAPI 3.0

```text
Tôi cần tích hợp tài liệu tương tác tự động Swagger UI cho hệ thống Express.js (TN-Backend) sử dụng swagger-jsdoc và swagger-ui-express.

Hãy triển khai:
1. Viết file src/config/swagger.js:
   - Định nghĩa OpenAPI Specification phiên bản 3.0.0.
   - Thông tin hệ thống: Tiêu đề "TN-Backend API — LHU Media Studio", phiên bản 2.0.0, mô tả chi tiết tech stack và hướng dẫn phân quyền.
   - Cấu hình server: URL `http://localhost:${PORT || 5000}`.
   - Cấu hình Security Scheme: Định nghĩa scheme `BearerAuth` kiểu HTTP Bearer JWT để cho phép dán token ủy quyền trực tiếp trên giao diện Swagger.
   - Cấu hình đường dẫn quét JSDoc: `apis: ['./src/routes/*.js']`.
   - Hàm setupSwagger(app) phục vụ trang UI tại đường dẫn `/api-docs`.
2. Viết mẫu JSDoc annotations chuẩn OpenAPI cho các route mẫu (ví dụ: đăng nhập POST /api/auth/login, lấy danh sách thiết bị GET /api/equipments) gồm tags, summary, security, requestBody, parameters và các responses (200, 400, 401, 403, 500).
```

### Prompt 11 – Script ETL Đọc File Excel, Khớp Nối Ảnh và Nhập Kho Thiết bị vào Database

```text
Tôi có file Excel dữ liệu kiểm kê "thiết bị cho web.xlsx" (50 dòng) và thư mục hình ảnh thiết bị "img web" (24 ảnh). Dự án Backend chạy Node.js sử dụng Express + Sequelize kết nối Microsoft SQL Server.

Hãy viết một script độc lập import-devices.js đọc dữ liệu từ file Excel, khớp nối hình ảnh từ thư mục cục bộ, upload lên Cloudinary và nhập vào cơ sở dữ liệu:

1. Đọc và phân tích file Excel:
   - Sử dụng ExcelJS đọc 50 dòng dữ liệu: Mã thiết bị, Tên thiết bị, Mô tả, Số lượng, Tên danh mục, Tình trạng, Link ảnh cũ.
   - Gom nhóm (group by) các dòng có cùng Tên thiết bị và Danh mục để tính tổng số lượng tồn kho (ví dụ: 10 dòng Bộ đàm Kenwood gom thành 1 thiết bị số lượng 10; Pin Const số lượng 6; Máy quay 4K số lượng 4...).
2. Đồng bộ danh mục (EquipmentCategory):
   - Trích xuất danh sách danh mục phân biệt và dùng `EquipmentCategory.findOrCreate` để lưu vào DB trước.
3. Xử lý hình ảnh và upload Cloudinary:
   - Khớp nối tên file từ đường dẫn cũ trong Excel với file thực tế trong thư mục "img web" (khớp không phân biệt hoa thường).
   - Tự động upload ảnh lên Cloudinary vào thư mục `lhu-media/equipment`.
   - Xây dựng cơ chế cache ảnh: Mỗi file ảnh chỉ upload đúng 1 lần, các thiết bị dùng chung ảnh sẽ tái sử dụng URL đã upload.
   - Lưu 1 bản sao dự phòng vào thư mục local `uploads/equipment`.
4. Xử lý mã code thiết bị và lưu Database:
   - Bảng Equipments có ràng buộc UNIQUE trên cột code. Đối với các dòng thiếu mã trong Excel, tự động sinh mã gợi nhớ chuẩn (ví dụ: CANON-EOS-R8, AMARAN-300C, GODOX-V1C-PRO...).
   - Đối với các dòng trùng mã code trong Excel (ví dụ máy 6D và lens 70-200 cùng mang mã 9061), tự động thêm hậu tố '-1' để không vi phạm ràng buộc UNIQUE của SQL Server.
   - Dùng Sequelize Model Equipment để upsert (cập nhật nếu đã có, tạo mới nếu chưa có) kèm `quantity` và `availableQuantity` bằng tổng số lượng đã gom nhóm.
5. Hỗ trợ tùy chọn dòng lệnh `--reset` (xóa dữ liệu cũ trước khi nạp) và `--local-only` (chỉ dùng ảnh local, không gọi Cloudinary).
```

### Prompt 12 – Xây dựng Bộ Unit Test Tự động cho các Logic Nghiệp vụ Lõi với Node Test Runner

```text
Tôi cần xây dựng bộ Unit Test tự động cho hệ thống TN-Backend để kiểm thử các logic nghiệp vụ quan trọng phục vụ báo cáo bảo vệ đồ án. Yêu cầu sử dụng trực tiếp bộ thư viện kiểm thử tích hợp sẵn của Node.js (`node:test` và `node:assert/strict`), không cài thêm Jest hay Mocha.

Hãy viết file test/unit.test.js bao gồm 6 Test Suites độc lập:
1. Test Suite 1: Mã hóa và xác thực mật khẩu bằng bcryptjs.
   - Test 1.1: Mật khẩu hash phải khác mật khẩu gốc và có tiền tố $2a$ hoặc $2b$ với saltRounds = 10.
   - Test 1.2: bcrypt.compare trả về true khi nhập đúng mật khẩu.
   - Test 1.3: bcrypt.compare trả về false khi nhập sai mật khẩu.
2. Test Suite 2: Ký phát và xác minh JWT Token bằng jsonwebtoken.
   - Test 2.1: jwt.sign và jwt.verify giải mã chính xác payload { id, email, role }.
   - Test 2.2: jwt.verify ném lỗi JsonWebTokenError khi token bị sai secret key.
   - Test 2.3: jwt.verify ném lỗi TokenExpiredError khi token hết hạn (expiresIn: '0s').
3. Test Suite 3: Phân quyền RBAC của middleware authorize.
   - Test 3.1: Người dùng có role ADMIN truy cập endpoint yêu cầu quyền ADMIN -> next() được gọi.
   - Test 3.2: Người dùng có role USER truy cập endpoint yêu cầu quyền ADMIN -> Chặn và trả về HTTP 403 Forbidden.
4. Test Suite 4: Thuật toán kiểm tra xung đột thời gian đặt phòng Studio.
   - Test 4.1: Phát hiện trùng lịch khi ca mới nằm hoàn toàn bên trong ca đã được duyệt.
   - Test 4.2: Phát hiện trùng lịch khi ca mới bắt đầu trước và kết thúc ở giữa ca đã được duyệt.
   - Test 4.3: Xác nhận không trùng lịch khi hai ca thời gian liền kề nhau (ca sau bắt đầu đúng lúc ca trước kết thúc).
5. Test Suite 5: Logic toán tử phân trang (Pagination Math).
   - Test 5.1: Trang 1 với limit 10 -> offset = 0, totalPages tính đúng.
   - Test 5.2: Trang 3 với limit 10 -> offset = 20.
   - Test 5.3: Xử lý an toàn khi tham số page truyền vào là số âm hoặc chuỗi không hợp lệ -> tự động đưa về trang 1, offset = 0.
6. Test Suite 6: Kiểm soát số lượng tồn kho khả dụng khi mượn thiết bị.
   - Test 6.1: Cho phép mượn khi số lượng yêu cầu nhỏ hơn hoặc bằng availableQuantity, trừ tồn kho chính xác.
   - Test 6.2: Từ chối yêu cầu mượn vượt quá số lượng khả dụng trong kho.
   - Test 6.3: Từ chối yêu cầu mượn khi số lượng yêu cầu <= 0.

Cấu hình script kiểm thử trong package.json để có thể chạy toàn bộ test bằng lệnh `npm test` hoặc `node --test test/unit.test.js`.
```
