'use strict';

/**
 * @file config/swagger.js
 * @description Cấu hình Swagger (OpenAPI 3.0) cho tự động sinh tài liệu API.
 *
 * swagger-jsdoc: Đọc JSDoc comment trong code và tạo spec JSON.
 * swagger-ui-express: Render trang UI đẹp tại /api-docs từ spec JSON.
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Định nghĩa thông tin chung của API (OpenAPI Specification)
const options = {
  definition: {
    openapi: '3.0.0', // Phiên bản OpenAPI
    info: {
      title: '📋 TN-Backend API — LHU Media Studio',
      version: '2.0.0',
      description: `
## Tài liệu API — Đồ án cuối khóa LHU Media Studio

### Tech Stack
- **Node.js + Express.js**: REST API server
- **Sequelize ORM + SQL Server (MSSQL)**: Database
- **JWT + bcryptjs**: Authentication & password hashing
- **Cloudinary**: Upload & lưu ảnh/video trên cloud
- **Nodemailer + Gmail SMTP**: Gửi email OTP xác thực
- **ExcelJS**: Xuất báo cáo .xlsx

### Cách xác thực:
1. Đăng nhập qua \`POST /api/auth/login\` để lấy token.
2. Nhấn nút **Authorize** (🔓) ở trên cùng, nhập \`Bearer <token>\`.
3. Tất cả API có 🔒 sẽ tự động gửi token.

### Phân quyền (RBAC):
- **Public** ❌: Không cần đăng nhập
- **User** ✅: Cần JWT token
- **Admin** 🔐: Cần JWT token + role ADMIN
      `,
      contact: {
        name: 'LHU Media Studio Backend',
        email: 'hangbich045@gmail.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: '🖥️ Local Development Server',
      },
    ],
    // Định nghĩa scheme bảo mật JWT (Bearer Token)
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập JWT token nhận được sau khi đăng nhập. Ví dụ: `Bearer eyJhbGci...`',
        },
      },
    },
    // Áp dụng bảo mật mặc định cho tất cả API (có thể override ở từng endpoint)
    security: [{ BearerAuth: [] }],
  },

  // Đường dẫn tới các file có JSDoc comment (@swagger)
  // Swagger-jsdoc sẽ quét các file này để tạo spec
  apis: [
    './src/routes/*.js',       // Quét tất cả file route
    './src/controllers/*.js',  // Quét tất cả file controller (nếu có JSDoc ở đây)
  ],
};

// Tạo spec JSON từ JSDoc comments
const swaggerSpec = swaggerJsdoc(options);

/**
 * Hàm thiết lập Swagger UI cho Express app
 * @param {import('express').Application} app - Express application instance
 */
const setupSwagger = (app) => {
  // Trang Swagger UI
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true, // Hiển thị thanh tìm kiếm
      customSiteTitle: 'TN-Backend API Docs',
      customCss: `
        .swagger-ui .topbar { background-color: #1a1a2e; }
        .swagger-ui .topbar-wrapper img { display: none; }
        .swagger-ui .topbar-wrapper::before {
          content: '📋 TN-Backend API';
          color: white;
          font-size: 1.2rem;
          font-weight: bold;
        }
      `,
    })
  );

  // Endpoint trả về spec JSON (dùng để import vào Postman)
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`📄 Swagger UI: http://localhost:${process.env.PORT || 5000}/api-docs`);
};

module.exports = { setupSwagger };
